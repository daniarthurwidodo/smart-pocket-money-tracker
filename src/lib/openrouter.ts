interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: { type: 'json_object' };
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

const OPENROUTER_TIMEOUT_MS = 15000; // 15 seconds timeout
const OPENROUTER_RETRY_DELAY_MS = 2000; // 2 seconds between retries
const OPENROUTER_MAX_RETRIES = 2; // Retry up to 2 times for slow requests

// Primary and fallback models
const PRIMARY_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const FALLBACK_MODEL = 'google/gemini-2.5-flash-lite';

export class OpenRouterClient {
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    this.apiKey = apiKey;
  }

  async parsePocketPrompt(userPrompt: string, retryCount: number = 0, useFallback: boolean = false): Promise<PocketData | null> {
    const systemPrompt = `Anda adalah asisten pelacak uang saku. Analisis permintaan pengguna dan ekstrak informasi pocket.

**PENTING**:
- NAMA pocket TIDAK WAJIB (nullable). Pengguna tidak harus memberikan nama.
- Jika pengguna ingin MENGUPDATE atau MENGHAPUS pocket, ID WAJIB diisi. Jika tidak ada ID, kembalikan null.
- Ekstrak TANGGAL (target_date) jika pengguna menyebutkan tanggal spesifik.
- Kembalikan HANYA JSON yang valid. Tanpa teks lain.

**Actions yang valid**: "create", "update", "delete", "list"

**Format respons untuk permintaan valid**:
{
  "action": "create" | "update" | "delete" | "list",
  "pocket": {
    "name": string (opsional, bisa null),
    "balance": number (opsional, default 0),
    "currency": string (opsional, default "IDR", harus 3 huruf kode ISO),
    "description": string (opsional, untuk catatan tambahan),
    "targetDate": string (opsional, format YYYY-MM-DD, jika pengguna menyebutkan tanggal),
    "isActive": boolean (opsional, default true)
  },
  "id": number (WAJIB untuk update/delete)
}

**Catatan**:
- Jika pengguna menyebutkan tanggal, ekstrak ke field "targetDate" dengan format YYYY-MM-DD
- Contoh: "saya ingin menyimpan 5000 tanggal 20 februari 2026" -> targetDate: "2026-02-20"

**Kapan mengembalikan null**:
- Permintaan pengguna tidak jelas atau ambigu
- Tidak ada ID pocket untuk update/delete
- Pengguna hanya mengobrol atau bertanya hal di luar manajemen pocket

**Contoh**:
- "Saya ingin menyimpan 5000 tanggal 20 februari 2026" -> {"action": "create", "pocket": {"balance": 5000, "targetDate": "2026-02-20"}}
- "Buat pocket Tabungan dengan 5000 untuk tanggal 20 februari 2026" -> {"action": "create", "pocket": {"name": "Tabungan", "balance": 5000, "targetDate": "2026-02-20"}}
- "Buat pocket Hiburan dengan 200 ribu" -> {"action": "create", "pocket": {"name": "Hiburan", "balance": 200000}}
- "Update pocket 5 jadi 500 ribu" -> {"action": "update", "id": 5, "pocket": {"balance": 500000}}
- "Hapus pocket 3" -> {"action": "delete", "id": 3}
- "Tampilkan semua pocket" -> {"action": "list"}
- "Halo, apa kabar?" -> null (tidak relevan)

**Tips**:
- Nama pocket opsional - jika pengguna tidak menyebutkan nama, biarkan null atau tidak ada
- Fokus pada jumlah (balance) dan tanggal (targetDate) yang disebutkan
- Dukung semua bahasa termasuk Bahasa Indonesia dan English.`;

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    // Determine which model to use
    const modelToUse = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Smart Pocket Money Tracker',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 300,
          temperature: 0.1,
        } as OpenRouterRequest),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API error:', response.status, errorData);

        if (response.status === 408 || response.status === 429) {
          throw new Error('OpenRouter API timeout or rate limit exceeded');
        }

        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json() as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return null;
      }

      const parsed = JSON.parse(content) as PocketData | null;

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      // Validate that action is one of the valid values
      const validActions = ['create', 'update', 'delete', 'list'];
      if (!parsed.action || !validActions.includes(parsed.action)) {
        console.log(`Invalid or missing action in parsed response:`, parsed);
        return null;
      }

      return parsed;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      // If using fallback model, don't retry - just throw the error
      if (useFallback) {
        console.error(
          `OpenRouter fallback model (${FALLBACK_MODEL}) also failed after ${elapsed}ms. No more retries.`
        );
        throw error;
      }

      // Retry logic for primary model
      if (retryCount < OPENROUTER_MAX_RETRIES) {
        console.log(
          `OpenRouter request with ${PRIMARY_MODEL} took ${elapsed}ms or failed, retrying (${retryCount + 1}/${OPENROUTER_MAX_RETRIES})...`
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, OPENROUTER_RETRY_DELAY_MS));

        return this.parsePocketPrompt(userPrompt, retryCount + 1, false);
      }

      // Primary model exhausted retries, switch to fallback
      console.log(
        `OpenRouter primary model (${PRIMARY_MODEL}) failed after ${retryCount + 1} attempts, switching to fallback model (${FALLBACK_MODEL})...`
      );
      return this.parsePocketPrompt(userPrompt, 0, true);
    }
  }
}

export interface PocketData {
  action: 'create' | 'update' | 'delete' | 'list';
  pocket?: {
    name?: string | null;
    balance?: number;
    currency?: string;
    description?: string | null;
    targetDate?: string | null;
    isActive?: boolean;
  };
  id?: number;
}

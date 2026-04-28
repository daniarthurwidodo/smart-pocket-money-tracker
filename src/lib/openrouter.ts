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
const PRIMARY_MODEL = 'google/gemini-2.5-flash';
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

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

  async parsePocketPrompt(userPrompt: string, retryCount: number = 0, useFallback: boolean = false): Promise<ParsePocketPromptResult> {
    const currentDateISO = new Date().toISOString().split('T')[0];
    const currentDateFormatted = (() => {
      const d = new Date();
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    })();

    const systemPrompt = `Anda adalah asisten pelacak uang saku. Analisis permintaan pengguna dan ekstrak informasi.

Tanggal hari ini: ${currentDateISO} (${currentDateFormatted} dalam format DD-MM-YYYY)

**Actions yang valid**: "create", "update", "delete", "list", "create_transaction"

---
**ACTION 1: create_transaction (untuk pencatatan pemasukan/pengeluaran)**

Gunakan ini ketika pengguna ingin mencatat pemasukan atau pengeluaran harian.

Format respons:
{
  "action": "create_transaction",
  "transaction": {
    "pemasukan": number,
    "pengeluaran": number,
    "tanggal": "DD-MM-YYYY"
  }
}

Aturan:
- "pemasukan" = pemasukan/pendapatan/income/tabungan (default 0)
- "pengeluaran" = pengeluaran/biaya/expense (default 0)
- "tanggal" WAJIB, format DD-MM-YYYY (tanpa leading zero: 9-4-2026 bukan 09-04-2026)
- Gunakan tanggal hari ini (${currentDateFormatted}) jika pengguna menyebut "hari ini", "today", "kini"
- Konversi semua angka teks: "200 ribu" = 200000, "1000" = 1000
- Jika hanya menyebut angka tunggal → itu pemasukan
- Jika menyebut "pengeluaran" atau "biaya" → itu pengeluaran

Contoh create_transaction:
- "Pemasukan 100000 pengeluaran 50000 tanggal 15-3-2026" -> {"action":"create_transaction","transaction":{"pemasukan":100000,"pengeluaran":50000,"tanggal":"15-3-2026"}}
- "Tabungan 233 pengeluaran 11 tanggal 9 April 2026" -> {"action":"create_transaction","transaction":{"pemasukan":233,"pengeluaran":11,"tanggal":"9-4-2026"}}
- "Catat pemasukan 50000 tanggal 1 mei 2026" -> {"action":"create_transaction","transaction":{"pemasukan":50000,"pengeluaran":0,"tanggal":"1-5-2026"}}

---
**ACTION 2: create pocket (untuk membuat budget/pocket baru)**

Format respons:
{
  "action": "create",
  "pocket": {
    "name": string | null,
    "balance": number,
    "currency": "IDR",
    "description": string | null,
    "targetDate": "YYYY-MM-DD" | null,
    "isActive": true
  }
}

Contoh:
- "Buat pocket Hiburan dengan 200 ribu" -> {"action":"create","pocket":{"name":"Hiburan","balance":200000}}
- "Buat tabungan 5000" -> {"action":"create","pocket":{"name":"Tabungan","balance":5000}}

---
**ACTION 3: update pocket**
{
  "action": "update",
  "id": number,
  "pocket": {"balance": number, ...}
}

**ACTION 4: delete pocket**
{
  "action": "delete",
  "id": number
}

**ACTION 5: list pockets**
{
  "action": "list"
}

---
**PENTING**:
- Kembalikan HANYA JSON valid. Tanpa markdown, tanpa teks lain.
- Jika permintaan tidak relevan dengan semua action di atas, kembalikan null.
- Untuk pencatatan uang masuk/keluar harian -> Gunakan "create_transaction"
- Untuk manajemen pocket/budget -> Gunakan "create", "update", "delete", "list"
- Dukung Bahasa Indonesia dan English.`;

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
        return {
          parsedData: null,
          modelUsed: modelToUse,
          fallbackUsed: useFallback,
          retryCount: retryCount,
        };
      }

      const parsed = JSON.parse(content) as PocketData | null;

      if (!parsed || typeof parsed !== 'object') {
        return {
          parsedData: null,
          modelUsed: modelToUse,
          fallbackUsed: useFallback,
          retryCount: retryCount,
        };
      }

      // Validate that action is one of the valid values
      const validActions = ['create', 'update', 'delete', 'list', 'create_transaction'];
      if (!parsed.action || !validActions.includes(parsed.action)) {
        console.log(`Invalid or missing action in parsed response:`, parsed);
        return {
          parsedData: null,
          modelUsed: modelToUse,
          fallbackUsed: useFallback,
          retryCount: retryCount,
        };
      }

      return {
        parsedData: parsed,
        modelUsed: modelToUse,
        fallbackUsed: useFallback,
        retryCount: retryCount,
      };
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
  action: 'create' | 'update' | 'delete' | 'list' | 'create_transaction';
  pocket?: {
    name?: string | null;
    balance?: number;
    currency?: string;
    description?: string | null;
    targetDate?: string | null;
    isActive?: boolean;
  };
  transaction?: {
    pemasukan?: number;
    pengeluaran?: number;
    tanggal: string;
  };
  id?: number;
}

export interface ParsePocketPromptResult {
  parsedData: PocketData | null;
  modelUsed: string;
  fallbackUsed: boolean;
  retryCount: number;
}

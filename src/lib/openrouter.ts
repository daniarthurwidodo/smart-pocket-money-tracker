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

  async parsePocketPrompt(userPrompt: string): Promise<PocketData | null> {
    const systemPrompt = `You are a pocket money tracker assistant. Parse the user's request and extract pocket information. Return ONLY a valid JSON object with the following structure:

{
  "action": "create" | "update" | "delete" | "list",
  "pocket": {
    "name": string (required for create/update),
    "balance": number (optional, defaults to 0),
    "currency": string (optional, defaults to "USD", must be 3-letter ISO code),
    "description": string (optional),
    "date": string in ISO format YYYY-MM-DD (optional, defaults to today),
    "isActive": boolean (optional, defaults to true)
  },
  "id": number (required only for update/delete actions)
}

If the user's request doesn't contain enough information to create a pocket (missing name), return null.
Only return the JSON object, no other text.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Smart Pocket Money Tracker',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
          temperature: 0.1,
        } as OpenRouterRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API error:', response.status, errorData);
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

      return parsed;
    } catch (error) {
      console.error('OpenRouterClient.parsePocketPrompt error:', error);
      throw error;
    }
  }
}

export interface PocketData {
  action: 'create' | 'update' | 'delete' | 'list';
  pocket?: {
    name: string;
    balance?: number;
    currency?: string;
    description?: string;
    date?: string;
    isActive?: boolean;
  };
  id?: number;
}

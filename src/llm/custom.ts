export class CustomLLMProvider {
  client: CustomLLMClient;
  model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.client = new CustomLLMClient(options);
    this.model = options.model || 'default';
  }

  async complete(prompt: string, opts: Record<string, any> = {}) {
    // If messages array is provided, use it directly (for multi-turn conversations)
    // Otherwise, wrap the prompt as a single user message
    const messages = opts.messages || [
      { role: 'user', content: prompt }
    ];
    
    // Pass messages to the client
    return await this.client.chat({ messages });
  }
}
export class CustomLLMClient {
  baseUrl: string;

  constructor({ baseUrl = 'http://localhost:5001' }: { baseUrl?: string } = {}) {
    this.baseUrl = baseUrl;
  }

  async chat({ messages }: { messages: Array<{ role: string, content: string }> }) {
    // Send messages array directly to Python server
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    
    // Check if response is OK before parsing
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Custom LLM server error (${res.status}): ${text.substring(0, 200)}`);
    }
    
    // Check content type to ensure it's JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Custom LLM server returned non-JSON response (${contentType}): ${text.substring(0, 200)}`);
    }
    
    const data = await res.json();
    
    // Validate response structure
    if (!data || typeof data.response !== 'string') {
      throw new Error(`Custom LLM server returned invalid response structure: ${JSON.stringify(data)}`);
    }
    
    return data.response;
  }
}

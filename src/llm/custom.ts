export class CustomLLMProvider {
  client: CustomLLMClient;
  model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.client = new CustomLLMClient(options);
    this.model = options.model || 'default';
  }

  async complete(prompt: string, opts: Record<string, any> = {}) {
    // For compatibility, wrap prompt as a user message
    const messages = opts.messages || [
      { role: 'user', content: prompt }
    ];
    return await this.client.chat({ messages });
  }
}
export class CustomLLMClient {
  baseUrl: string;

  constructor({ baseUrl = 'http://localhost:5001' }: { baseUrl?: string } = {}) {
    this.baseUrl = baseUrl;
  }

  async chat({ messages }: { messages: Array<{ role: string, content: string }> }) {
    // Combine messages into a single prompt, or adjust as needed for your Python server
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await res.json();
    return data.response;
  }
}

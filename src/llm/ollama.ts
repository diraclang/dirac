

export class OllamaClient {
  baseUrl: string;

  constructor({ baseUrl = 'http://localhost:11434' }: { baseUrl?: string } = {}) {
    this.baseUrl = baseUrl;
  }

  async generate({ model, prompt, options = {} }: { model: string; prompt: string; options?: Record<string, any> }) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, ...options }),
    });

    let output = '';
    for await (const chunk of res.body as any) {
      const chunkStr = chunk.toString();
      // console.log('[OllamaClient] Raw chunk:', chunkStr);
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          let jsonLine = line.trim();
          // If line looks like comma-separated numbers, decode as ASCII
          if (/^\d+(,\d+)*$/.test(jsonLine)) {
            jsonLine = jsonLine.split(',').map(n => String.fromCharCode(Number(n))).join('');
          }
          try {
            const obj = JSON.parse(jsonLine);
            if (obj.response) output += obj.response;
          } catch (err) {
            // Silently skip lines that can't be parsed
          }
        }
      }
    }
    return output;
  }
}

export class OllamaProvider {
  client: OllamaClient;
  model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.client = new OllamaClient(options);
    this.model = options.model || 'llama2';
  }

  async complete(prompt: string, opts: Record<string, any> = {}) {
    return await this.client.generate({
      model: this.model,
      prompt,
      options: opts,
    });
  }
}

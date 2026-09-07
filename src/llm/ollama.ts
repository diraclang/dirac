

function normalizeOllamaImage(image: string): string {
  if (!image) return '';

  const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (dataUrlMatch) {
    return dataUrlMatch[2];
  }

  return image;
}

export class OllamaClient {
  baseUrl: string;

  constructor({ baseUrl = 'http://localhost:11434' }: { baseUrl?: string } = {}) {
    this.baseUrl = baseUrl;
  }

  async generate({ model, prompt, options = {}, images = [] }: { model: string; prompt: string; options?: Record<string, any>; images?: string[] }) {
    const imageSources = Array.isArray(images) && images.length > 0
      ? images
      : Array.isArray(options.images)
        ? options.images
        : [];

    const normalizedImages = imageSources
      .map(normalizeOllamaImage)
      .filter((image) => image && image.trim().length > 0);

    const { images: _ignoredImages, ...safeOptions } = options;

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        ...(normalizedImages.length > 0 ? { images: normalizedImages } : {}),
        ...safeOptions,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Ollama request failed (${res.status}): ${errBody}`);
    }

    if (!res.body) {
      return '';
    }

    const decoder = new TextDecoder('utf-8');
    let pending = '';
    let output = '';

    const processLine = (line: string): void => {
      const jsonLine = line.trim();
      if (!jsonLine) {
        return;
      }

      try {
        const obj = JSON.parse(jsonLine);
        if (typeof obj.response === 'string') {
          output += obj.response;
        }
      } catch {
        // Ignore malformed/incomplete line fragments.
      }
    };

    for await (const chunk of res.body as any) {
      pending += decoder.decode(chunk, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        processLine(line);
      }
    }

    pending += decoder.decode();
    processLine(pending);

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
      images: Array.isArray(opts.images) ? opts.images : [],
    });
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';

import { OllamaProvider } from '../src/llm/ollama.ts';

test('Ollama strips data URLs before sending images to /api/generate', async () => {
  const requests: any[] = [];

  globalThis.fetch = async (_url: string | URL, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}'));
    requests.push(payload);

    return new Response(JSON.stringify({ response: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const provider = new OllamaProvider({ model: 'llava' });

  await provider.complete('describe this image', {
    model: 'llava',
    temperature: 0.2,
    max_tokens: 128,
    images: ['data:image/png;base64,AAAA'],
  });

  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].images, ['AAAA']);
  assert.equal(requests[0].model, 'llava');
});

test('Ollama stream parser preserves responses across chunk boundaries', async () => {
  globalThis.fetch = async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"response":"Se","done":false}\n{"res'));
        controller.enqueue(encoder.encode('ponse":"oul","done":false}\n{"done":true}\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const provider = new OllamaProvider({ model: 'qwen3.8' });
  const response = await provider.complete('What is the capital of Korea?');

  assert.equal(response, 'Seoul');
});

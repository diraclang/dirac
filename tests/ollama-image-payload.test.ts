import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { OllamaProvider } from '../src/llm/ollama.ts';
import { execute } from '../src/index.ts';

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

test('llm image attribute accepts variable substitution via subroutine parameter', async () => {
  const requests: any[] = [];
  const imagePath = path.join(process.cwd(), 'tests', 'fixtures', 'tiny-test-image.png');

  // 1x1 PNG
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z8xQAAAAASUVORK5CYII=';
  fs.writeFileSync(imagePath, Buffer.from(pngBase64, 'base64'));

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url: string | URL, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}'));
    requests.push(payload);

    return new Response(JSON.stringify({ response: 'ok', done: true }) + '\n', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const source = `
<dirac>
  <subroutine name="llava" param-image="string">
    <llm provider="ollama" model="llava" image="$image">what is in the image</llm>
  </subroutine>
  <llava image="tests/fixtures/tiny-test-image.png" />
</dirac>
`;

    await execute(source, {
      llmProvider: 'ollama',
      llmModel: 'llava',
    });

    assert.equal(requests.length, 1);
    assert.equal(Array.isArray(requests[0].images), true);
    assert.equal(requests[0].images.length, 1);
    assert.equal(typeof requests[0].images[0], 'string');
    assert.equal(requests[0].images[0].startsWith('iVBORw0KGgo'), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
});

test('llm image attribute expands a leading ~ to the home directory', async () => {
  const requests: any[] = [];
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z8xQAAAAASUVORK5CYII=';
  const homeImagePath = path.join(os.homedir(), `dirac-tilde-test-${Date.now()}.png`);
  fs.writeFileSync(homeImagePath, Buffer.from(pngBase64, 'base64'));

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url: string | URL, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}'));
    requests.push(payload);

    return new Response(JSON.stringify({ response: 'ok', done: true }) + '\n', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const source = `
<dirac>
  <llm provider="ollama" model="llava" image="~/${path.basename(homeImagePath)}">what is in the image</llm>
</dirac>
`;

    await execute(source, {
      llmProvider: 'ollama',
      llmModel: 'llava',
    });

    assert.equal(requests.length, 1);
    assert.equal(Array.isArray(requests[0].images), true);
    assert.equal(requests[0].images[0].startsWith('iVBORw0KGgo'), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (fs.existsSync(homeImagePath)) {
      fs.unlinkSync(homeImagePath);
    }
  }
});

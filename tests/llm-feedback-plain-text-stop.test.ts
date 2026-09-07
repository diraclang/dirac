import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('llm execute+feedback stops when response has no XML tags', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = (async (_url: string | URL | globalThis.Request, init?: RequestInit) => {
    callCount++;

    const body = JSON.parse(String(init?.body ?? '{}'));
    assert.equal(Array.isArray(body.messages), true);

    return new Response(JSON.stringify({ response: 'This is analysis text without XML.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const source = `
<dirac>
  <llm execute="true" feedback="true">Explain what this script should do</llm>
</dirac>
`;

    const output = await execute(source, {
      llmProvider: 'custom',
      customLLMUrl: 'http://fake-llm.local',
    });

    assert.equal(callCount, 1);
    assert.equal(output.includes('This is analysis text without XML.'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

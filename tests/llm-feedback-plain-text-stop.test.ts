import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';
import { DiracShell } from '../src/shell.ts';

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

test('llm execute respects XML fences as inert text when replace-tick is enabled', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = (async (_url: string | URL | globalThis.Request, init?: RequestInit) => {
    callCount++;

    const body = JSON.parse(String(init?.body ?? '{}'));
    assert.equal(Array.isArray(body.messages), true);

    return new Response(JSON.stringify({
      response: '```xml\n<greeting>Hello from fenced XML</greeting>\n```',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const source = `
<dirac>
  <llm execute="true" replace-tick="true">Explain what this script should do</llm>
</dirac>
`;

    const output = await execute(source, {
      llmProvider: 'custom',
      customLLMUrl: 'http://fake-llm.local',
    });

    assert.equal(callCount, 1);
    assert.equal(output.includes('```xml'), true);
    assert.equal(output.includes('<greeting>Hello from fenced XML</greeting>'), true);
    assert.equal(output.includes('Hello from fenced XML'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('question-mark shorthand can be configured to any subroutine target', () => {
  const shell = new DiracShell({ questionMarkTarget: 'mySubroutine' } as any);

  const mapped = (shell as any).normalizeQuestionMarkInput('? hello there');

  assert.equal(mapped, '|mySubroutine>hello there');
});

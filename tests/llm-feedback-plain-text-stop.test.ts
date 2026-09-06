import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';
import { DiracShell } from '../src/shell.ts';
import { DiracParser } from '../src/runtime/parser.ts';
import { BraKetParser } from '../src/runtime/braket-parser.ts';
import { serializeSubroutineToXML, serializeSubroutineToBraKet } from '../src/utils/subroutine-serializer.ts';

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

test('quit save-all saves unsaved subroutines as XML', async () => {
  const shell = new DiracShell({} as any);
  let capturedXml = '';
  (shell as any).xmlParser.parse = (input: string) => {
    capturedXml = input;
    return { tag: 'save-subroutine', attributes: {} };
  };
  (shell as any).integrateFn = async () => undefined;
  (shell as any).session.output = [];

  await (shell as any).saveAllUnsavedSubroutines(['demo']);

  assert.match(capturedXml, /format="xml"/);
  assert.doesNotMatch(capturedXml, /format="braket"/);
});

test('fenced XML/Dirac blocks are preserved as literal text by the parser', () => {
  const parser = new DiracParser();
  const ast = parser.parse('```xml\n<greeting>Hello from fenced XML</greeting>\n```');

  assert.equal(ast.tag, 'DIRAC-ROOT');
  assert.equal(ast.children.length >= 1, true);
  const literalText = ast.children
    .map((child) => child.text ?? '')
    .join('');
  assert.equal(literalText.includes('<greeting>Hello from fenced XML</greeting>'), true);
});

test('literal fenced XML survives subroutine serialization and reparse', () => {
  const parser = new DiracParser();
  const source = [
    '<subroutine name="sys-router">',
    '  ```xml',
    '  you are a coder, use <system> tag to enclose unix command, e.g., <system>ls -l</system> for list file, or <python> tag for python script.',
    '  ```',
    '</subroutine>',
  ].join('\n');

  const ast = parser.parse(source);
  const xml = serializeSubroutineToXML({ name: 'sys-router', element: ast });
  const reparsed = parser.parse(xml);

  const literalText = collectText(reparsed);
  assert.equal(literalText.includes('<system> tag to enclose unix command'), true);
  assert.equal(literalText.includes('<python> tag for python script'), true);
  assert.equal(literalText.includes('</system>'), true);
  assert.equal(literalText.includes('```xml'), false);
});

test('literal fenced XML survives bra-ket save/reopen roundtrip', () => {
  const parser = new DiracParser();
  const braKetParser = new BraKetParser();
  const source = [
    '<subroutine name="sys-router">',
    '  ```xml',
    '  you are a coder, use <system> tag to enclose unix command, e.g., <system>ls -l</system> for list file, or <python> tag for python script.',
    '  ```',
    '</subroutine>',
  ].join('\n');

  const ast = parser.parse(source);
  const braket = serializeSubroutineToBraKet({ name: 'sys-router', element: ast });
  const xmlFromBraKet = braKetParser.parse(braket);
  const reparsed = parser.parse(xmlFromBraKet);
  const literalText = collectText(reparsed);

  assert.equal(literalText.includes('<system> tag to enclose unix command'), true);
  assert.equal(literalText.includes('<python> tag for python script'), true);
  assert.equal(literalText.includes('</system>'), true);
  assert.equal(braket.includes('<![CDATA['), true);
});

function collectText(node: any): string {
  const out: string[] = [];
  if (!node) return '';
  if (typeof node.text === 'string') out.push(node.text);
  if (Array.isArray(node.children)) {
    for (const child of node.children) out.push(collectText(child));
  }
  return out.join('');
}

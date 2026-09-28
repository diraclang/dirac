import test from 'node:test';
import assert from 'node:assert/strict';

import { BraKetParser } from '../src/runtime/braket-parser.ts';
import { DiracParser, createSession, integrate } from '../src/index.ts';

async function runInSession(session: ReturnType<typeof createSession>, input: string) {
  const braket = new BraKetParser();
  const xmlParser = new DiracParser();
  const xml = braket.parse(input);
  const ast = xmlParser.parse(xml);
  await integrate(session, ast);
}

test('inline child call after extends does not leave nested subs on stack', async () => {
  const session = createSession();

  await runInSession(session, '<Object|\n  <A|\n    |output>A\n');
  await runInSession(session, '<Object extends=Object|\n  <B|\n    |output>B\n');

  // Trigger the exact pattern reported in dish.
  await runInSession(session, '|Object>|A>');

  const names = session.subroutines.map((s) => s.name);

  // Top-level Object definitions should remain in a persistent shell session.
  assert.equal(names.filter((n) => n === 'Object').length, 2);
  // Nested methods should not leak onto the global stack.
  assert.equal(names.includes('A'), false);
  assert.equal(names.includes('B'), false);
});

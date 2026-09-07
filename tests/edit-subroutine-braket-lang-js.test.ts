import test from 'node:test';
import assert from 'node:assert/strict';

import { createSession, getSubroutine } from '../src/runtime/session.ts';
import { DiracParser } from '../src/runtime/parser.ts';
import { integrate } from '../src/runtime/interpreter.ts';

function collectText(element: any): string {
  let text = element?.text || '';
  for (const child of element?.children || []) {
    if (!child.tag && child.text) {
      text += child.text;
    }
  }
  return text;
}

test('<edit-subroutine format="braket"> preserves lang="js" code body', async () => {
  const session = createSession({});
  const parser = new DiracParser();

  const source = `
<dirac>
  <subroutine name="test-javascript" param-a="number" lang="js">
function A(i){return i+1}
console.log(A(a))
  </subroutine>
</dirac>
`;

  await integrate(session, parser.parse(source));

  const before = getSubroutine(session, 'test-javascript');
  assert.equal(collectText(before).includes('function A(i)'), true);

  // Use the no-op "true" command as the editor so the round-trip is exercised
  // without any manual edits, isolating the serialize/reparse behavior.
  await integrate(session, {
    tag: 'edit-subroutine',
    attributes: { name: 'test-javascript', format: 'braket', editor: 'true' },
    children: [],
  });

  const after = getSubroutine(session, 'test-javascript');
  const afterText = collectText(after);
  assert.equal(afterText.includes('function A(i){return i+1}'), true);
  assert.equal(afterText.includes('console.log(A(a))'), true);
});

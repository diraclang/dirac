import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

test('<edit-subroutine> reopens unsaved in-memory edits instead of reloading disk source', async () => {
  const session = createSession({});
  const parser = new DiracParser();
  const tempDir = mkdtempSync(join(tmpdir(), 'dirac-edit-prefer-memory-'));
  const sourceFile = join(tempDir, 'greet.di');

  try {
    const source = `<subroutine name="greet"><output>original</output></subroutine>\n`;
    writeFileSync(sourceFile, source, 'utf-8');

    await integrate(session, parser.parse(`<dirac>${source}</dirac>`));

    const loaded = session.subroutines.find((s) => s.name === 'greet');
    assert.ok(loaded);
    // Simulate file-backed subroutine loaded from disk.
    loaded.sourcePath = sourceFile;

    // First edit modifies temp content to "edited" and updates session only.
    await integrate(session, {
      tag: 'edit-subroutine',
      attributes: {
        name: 'greet',
        format: 'xml',
        editor: "sed -i '' 's/original/edited/g'",
      },
      children: [],
    });

    const afterFirstEdit = session.subroutines.find((s) => s.name === 'greet');
    assert.ok(afterFirstEdit);
    assert.equal(JSON.stringify(afterFirstEdit.element).includes('edited'), true);
    assert.equal(JSON.stringify(afterFirstEdit.element).includes('original'), false);
    assert.equal(afterFirstEdit.modified, true);

    // Second edit is no-op; it should keep "edited" from memory rather than
    // reverting to source file content (which is still "original").
    await integrate(session, {
      tag: 'edit-subroutine',
      attributes: { name: 'greet', format: 'xml', editor: 'true' },
      children: [],
    });

    const afterSecondEdit = session.subroutines.find((s) => s.name === 'greet');
    assert.ok(afterSecondEdit);
    assert.equal(JSON.stringify(afterSecondEdit.element).includes('edited'), true);
    assert.equal(JSON.stringify(afterSecondEdit.element).includes('original'), false);
    assert.equal(afterSecondEdit.modified, true);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

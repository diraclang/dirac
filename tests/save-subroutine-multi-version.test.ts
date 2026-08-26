import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { BraKetParser } from '../src/runtime/braket-parser.ts';
import { DiracParser, createSession, integrate } from '../src/index.ts';

async function runInSession(session: ReturnType<typeof createSession>, input: string) {
  const braket = new BraKetParser();
  const xmlParser = new DiracParser();
  const xml = braket.parse(input);
  const ast = xmlParser.parse(xml);
  await integrate(session, ast);
}

test('save-subroutine persists all same-name versions in stack order', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dirac-save-chain-'));
  const filePath = join(tempDir, 'Object.di');

  try {
    const session = createSession();

    await runInSession(
      session,
      '<Object|\n  <A|\n    |output>A\n'
    );

    await runInSession(
      session,
      '<Object extends=Object|\n  <B|\n    |output>B\n'
    );

    await runInSession(
      session,
      `|save-subroutine name=Object file=${filePath} format=xml>`
    );

    const content = readFileSync(filePath, 'utf-8');
    const occurrences = [...content.matchAll(/<subroutine name="Object"/g)];

    assert.equal(occurrences.length, 2);

    const firstIndex = occurrences[0].index ?? -1;
    const secondIndex = occurrences[1].index ?? -1;
    const extendsIndex = content.indexOf('extends="Object"');

    assert.equal(firstIndex >= 0, true);
    assert.equal(secondIndex > firstIndex, true);
    assert.equal(extendsIndex > secondIndex, true);

    const savedVersions = session.subroutines.filter((sub) => sub.name === 'Object');
    assert.equal(savedVersions.length, 2);
    assert.equal(savedVersions.every((sub) => sub.sourcePath === filePath), true);
    assert.equal(savedVersions.every((sub) => sub.modified === false), true);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

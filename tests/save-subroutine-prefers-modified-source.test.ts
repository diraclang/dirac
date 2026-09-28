import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('save-subroutine prefers modified sourcePath when no file/path is provided', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dirac-save-prefer-modified-'));
  const oldPath = join(tempDir, 'old', 'Object.di');
  const newPath = join(tempDir, 'new', 'Object.di');

  try {
    const session = createSession();

    await runInSession(
      session,
      '<Object|\n  <A|\n    |output>A1\n'
    );

    await runInSession(
      session,
      '<Object extends=Object|\n  <B|\n    |output>B1\n'
    );

    const objectVersions = session.subroutines.filter((sub: any) => sub.name === 'Object');
    assert.equal(objectVersions.length, 2);

    objectVersions[0].sourcePath = oldPath;
    objectVersions[1].sourcePath = newPath;

    // Simulate that version[0] was edited in-session and should be the one persisted.
    objectVersions[0].modified = true;

    // Ensure files already exist to mirror real save-overwrite behavior.
    mkdirSync(join(tempDir, 'old'), { recursive: true });
    mkdirSync(join(tempDir, 'new'), { recursive: true });
    writeFileSync(oldPath, '<subroutine name="Object"><output>OLD</output></subroutine>\n', 'utf-8');
    writeFileSync(newPath, '<subroutine name="Object"><output>NEW</output></subroutine>\n', 'utf-8');

    await runInSession(session, '|save-subroutine name=Object format=xml>');

    const oldContent = readFileSync(oldPath, 'utf-8');
    const newContent = readFileSync(newPath, 'utf-8');

    assert.equal(oldContent.includes('<!-- Exported subroutine chain -->'), true);
    assert.equal(newContent, '<subroutine name="Object"><output>NEW</output></subroutine>\n');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

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

test('show-subroutine defaults to latest same-name definition and supports indexed selection', async () => {
  const session = createSession();

  await runInSession(
    session,
    '<Object|\n  |output>base\n'
  );

  await runInSession(
    session,
    '<Object extends=Object|\n  |output>child\n'
  );

  await runInSession(
    session,
    '|show-subroutine name=Object output=latestXml>\n|show-subroutine name=Object selection=1 format=braket output=baseBraket>'
  );

  const latestXml = session.variables.find((v) => v.name === 'latestXml')?.value;
  const baseBraket = session.variables.find((v) => v.name === 'baseBraket')?.value;

  assert.equal(typeof latestXml, 'string');
  assert.match(String(latestXml), /extends="Object"/);
  assert.match(String(latestXml), /child/);

  assert.equal(typeof baseBraket, 'string');
  assert.match(String(baseBraket), /<Object\|/);
  assert.doesNotMatch(String(baseBraket), /extends=Object/);
  assert.match(String(baseBraket), /\|output>base/);
});

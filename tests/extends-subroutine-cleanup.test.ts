import test from 'node:test';
import assert from 'node:assert/strict';

import { DiracParser, createSession, integrate } from '../src/index.ts';
import { getOutput } from '../src/runtime/session.ts';

test('extends calls do not leak nested subroutines after cleanup', async () => {
  const source = `
<dirac>
  <subroutine name="base">
    <subroutine name="helper" />
  </subroutine>

  <subroutine name="base" extends="base">
    <subroutine name="extra" />
  </subroutine>

  <subroutine name="wrapper">
    <base />
    <available-subroutines />
  </subroutine>

  <wrapper />
</dirac>
`;

  const parser = new DiracParser();
  const session = createSession();
  const ast = parser.parse(source);

  await integrate(session, ast);
  const output = getOutput(session);

  assert.equal(output.includes('<subroutines>'), true);
  assert.equal(output.includes('helper'), false);
  assert.equal(output.includes('extra'), false);
});

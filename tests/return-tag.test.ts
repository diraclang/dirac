import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('<return> sets the call site result via direct-tag call', async () => {
  const dirac = `
<dirac>
  <subroutine name="add-numbers" param-a="integer" param-b="integer">
    <eval result="sum">return Number(a) + Number(b);</eval>
    <return><variable name="sum" /></return>
  </subroutine>

  <add-numbers a="5" b="7" result="total" />
  <output><variable name="total" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), '12');
});

test('<return> sets the call site result via <call subroutine="...">', async () => {
  const dirac = `
<dirac>
  <subroutine name="add-numbers" param-a="integer" param-b="integer">
    <eval result="sum">return Number(a) + Number(b);</eval>
    <return><variable name="sum" /></return>
  </subroutine>

  <call subroutine="add-numbers" a="3" b="4" result="total" />
  <output><variable name="total" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), '7');
});

test('<return> short-circuits remaining statements in the subroutine body', async () => {
  const dirac = `
<dirac>
  <subroutine name="early-exit">
    <output>before-return</output>
    <return value="stopped" />
    <output>after-return</output>
  </subroutine>

  <early-exit result="status" />
  <output>|<variable name="status" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.includes('before-return'), true);
  assert.equal(output.includes('after-return'), false);
  assert.equal(output.trim().endsWith('|stopped'), true);
});

test('calling a subroutine without <return> and result="..." yields no crash', async () => {
  const dirac = `
<dirac>
  <subroutine name="no-return">
    <output>ran</output>
  </subroutine>

  <no-return result="unused" />
  <output>done</output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.includes('ran'), true);
  assert.equal(output.includes('done'), true);
});

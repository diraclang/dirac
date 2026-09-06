import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('python tag defaults to foreground mode when background is not requested', async () => {
  const dirac = `
<dirac>
  <python>
print("foreground-default")
  </python>
  <output>done</output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.includes('foreground-default'), true);
  assert.equal(output.includes('done'), true);
});

test('python tag remains foreground by default when result is requested', async () => {
  const dirac = `
<dirac>
  <python result="answer">
return 42
  </python>
  <output><variable name="answer" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), '42');
});

test('python tag runs in background only when background="true" is explicit', async () => {
  const dirac = `
<dirac>
  <python background="true">
print("background-explicit")
  </python>
  <output>done</output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), 'done');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('python tag defaults to background mode when result is not requested', async () => {
  const dirac = `
<dirac>
  <python>
print("background-default")
  </python>
  <output>done</output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), 'done');
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

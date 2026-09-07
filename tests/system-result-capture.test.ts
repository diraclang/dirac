import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('<system result="..."> captures stdout into a session variable', async () => {
  const dirac = `
<dirac>
  <system result="greeting">echo hello-system</system>
  <output><variable name="greeting" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.includes('hello-system'), true);
});

test('<system result="..." silent="true"> suppresses the default stdout emit', async () => {
  const dirac = `
<dirac>
  <system result="captured" silent="true">echo silent-value</system>
  <output>before|<variable name="captured" />|after</output>
</dirac>
`;

  const output = await execute(dirac);

  // silent="true" should prevent the raw stdout from being emitted directly,
  // but the captured variable should still contain it.
  assert.equal(output.includes('before|'), true);
  assert.equal(output.includes('silent-value'), true);
  assert.equal(output.trim().startsWith('before|silent-value'), true);
});

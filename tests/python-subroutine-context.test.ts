import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../src/index.ts';

test('python tag exposes subroutine stack and session snapshot', async () => {
  const dirac = `
<dirac>
  <subroutine name="alpha" description="first" />
  <subroutine name="beta" description="second" param-x="string" />

  <python result="ctx">
names = [s["name"] for s in __dirac_subroutines]
ctx = {
  "count": len(__dirac_subroutines),
  "names": names,
  "subBoundary": __dirac_session.get("subBoundary"),
  "hasParameters": isinstance(__dirac_subroutines[1].get("parameters"), list),
}
  </python>

  <eval name="ctx_json">return JSON.stringify(ctx);</eval>
  <output><variable name="ctx_json" /></output>
</dirac>
`;

  const output = await execute(dirac);
  const parsed = JSON.parse(output.trim());

  assert.equal(parsed.count, 2);
  assert.deepEqual(parsed.names, ['alpha', 'beta']);
  assert.equal(parsed.subBoundary, 0);
  assert.equal(parsed.hasParameters, true);
});

test('python tag can write back __dirac_updates payload', async () => {
  const dirac = `
<dirac>
  <python result="status">
status = "ok"
__dirac_updates = {
  "system_prompt": "Use only visible subroutines",
  "routing_hint": "subroutine-first"
}
  </python>

  <output><variable name="status" />|<variable name="system_prompt" />|<variable name="routing_hint" /></output>
</dirac>
`;

  const output = await execute(dirac);
  assert.equal(output.trim(), 'ok|Use only visible subroutines|subroutine-first');
});

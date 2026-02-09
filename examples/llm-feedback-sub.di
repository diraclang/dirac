#!/usr/bin/env dirac
<!-- Test: LLM feedback mode with subroutine
Description: Test feedback loop with a simple subroutine
Expected: Should call print-message and see the feedback loop work
-->

<dirac>
<subroutine name="print-message" param-text="string">
  <output><variable name="text" /></output>
</subroutine>

<llm 
  execute="true" 
  feedback="true" 
  max-iterations="2"
  validate="true"
  autocorrect="true"
  max-retries="2"
  replace-tick="true">
Call print-message with text="Hello from feedback loop!"
</llm>
</dirac>

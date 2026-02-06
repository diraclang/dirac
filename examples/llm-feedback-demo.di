#!/usr/bin/env dirac
<!-- Test: LLM feedback mode
Description: Test the feedback loop where LLM generates code, sees output, and can iterate
Expected: Should output "Hello from feedback loop!" and eventually say "DONE"
-->

<dirac>
<llm 
  execute="true" 
  feedback="true" 
  max-iterations="2"
  validate="true"
  autocorrect="true"
  max-retries="2"
  replace-tick="true"
  no-extra="true">
Use the output tag to print "Hello from feedback loop!"
</llm>
</dirac>

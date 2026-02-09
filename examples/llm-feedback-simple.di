#!/usr/bin/env dirac
<!-- Test: Simple feedback mode without validation -->

<dirac>
<subroutine name="greet" param-name="string">
  <output>Hello, <variable name="name" />!</output>
</subroutine>

<llm 
  execute="true" 
  feedback="true" 
  max-iterations="2"
  replace-tick="true">
Call greet with name="Feedback Test"
</llm>
</dirac>

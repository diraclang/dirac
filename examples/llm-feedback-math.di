#!/usr/bin/env dirac
<!-- Test: Feedback with math calculation -->

<dirac>
<subroutine name="add" description="addition of two numbers " param-a="number:required:first argument::1st arg" param-b="number:required:second argument::2nd arg">
  <expr eval="plus">
    <arg><variable name="a" /></arg>
    <arg><variable name="b" /></arg>
  </expr>
</subroutine>

<llm 
  execute="true" 
  feedback="true" 
  validate="true"
  autocorrect="true"
  max-iterations="3"
  replace-tick="true">
Calculate 5 + 3 using the add subroutine and display the result.
</llm>

</dirac>

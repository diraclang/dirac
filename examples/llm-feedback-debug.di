#!/usr/bin/env dirac
<!-- Test: Feedback with math calculation - DEBUG VERSION -->

<dirac>
<subroutine name="add" description="addition of two numbers" param-a="number:required:first argument::2" param-b="number:required:second argument::3">
  <output>DEBUG: a=<variable name="a" />, b=<variable name="b" />
</output>
  <expr eval="plus">
    <arg><variable name="a" /></arg>
    <arg><variable name="b" /></arg>
  </expr>
</subroutine>

<llm 
  execute="true" 
  feedback="true" 
  autocorrect="true"
  max-iterations="3"
  replace-tick="true"
  output-var="generated_code">
Calculate 5 + 3 using the add subroutine and display the result.
</llm>

<output>

Generated code was:
<variable name="generated_code" />
</output>

</dirac>

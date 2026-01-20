<!-- Simple Recursive Demo - LISP Style -->
<dirac>
  <output>Simple Recursion Demo&#10;&#10;</output>
  
  <!-- Subroutine that calculates something -->
  <subroutine name="CALC">
    <eval name="result">return 5 * 5;</eval>
    <output>Calculated: ${result}&#10;</output>
  </subroutine>
  
  <!-- Subroutine with nested LLM call -->
  <subroutine name="NESTED">
    <output>Entering nested call...&#10;</output>
    <LLM execute="true" maxTokens="50">
      &lt;dirac&gt;&lt;output&gt;From nested LLM!&#10;&lt;/output&gt;&lt;/dirac&gt;
    </LLM>
  </subroutine>
  
  <!-- Start with direct LLM execution -->
  <output>Starting...&#10;</output>
  <LLM execute="true" maxTokens="50">
    Copy this EXACTLY: &lt;dirac&gt;&lt;CALC /&gt;&lt;NESTED /&gt;&lt;/dirac&gt;
  </LLM>
  
  <output>Done!&#10;</output>
</dirac>

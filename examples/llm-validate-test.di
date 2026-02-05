<dirac>
  <subroutine name="greet" description="Greet someone by name" param-name="string:required:The person's name">
    <output>Hello, <variable name="name" />!</output>
  </subroutine>
  
  <subroutine name="calculate" description="Calculate a simple math expression" param-expression="string:required:Math expression to calculate">
    <output>Result: <variable name="expression" /></output>
  </subroutine>
  
  <output>Testing LLM with tag validation...</output>
  <output>&#10;</output>
  
  <llm execute="true" validate="true" autocorrect="true" max-retries="2" maxTokens="200">
    Greet the user named Alice
  </llm>
  
  <output>&#10;</output>
</dirac>

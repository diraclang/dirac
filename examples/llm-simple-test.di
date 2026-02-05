<dirac>
  <defvar name="topic" value="test" />
  <output>Topic is: <variable name="topic" /></output>
  <output>&#10;</output>
  
  <LLM output="response" maxTokens="50" noextra="true">
Say hello
  </LLM>
  
  <output>Response: <variable name="response" /></output>
  <output>&#10;</output>
</dirac>

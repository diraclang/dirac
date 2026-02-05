<!-- LLM integration example - THE INNOVATION -->
<dirac>
  <defvar name="topic" value="quantum computing" />
  
  <output>Asking LLM about <variable name="topic" />...&#10;&#10;</output>
  
  <LLM output="response" maxTokens="200">
    Explain <variable name="topic" /> in one sentence.
  </LLM>
  
  <output>Response: <variable name="response" />&#10;</output>
</dirac>

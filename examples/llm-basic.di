<!-- LLM integration example - THE INNOVATION -->
<dirac>
  <defvar name="topic" value="quantum computing" />
  
  <output>Asking LLM about ${topic}...&#10;&#10;</output>
  
  <LLM output="response" maxTokens="200">
    Explain ${topic} in one sentence.
  </LLM>
  
  <output>Response: ${response}&#10;</output>
</dirac>

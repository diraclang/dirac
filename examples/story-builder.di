<!-- Story Builder - Loop with LLM -->
<dirac>
  <defvar name="character" value="a curious robot" />
  <defvar name="setting" value="abandoned space station" />
  
  <output>Creating a story about ${character} in ${setting}...&#10;&#10;</output>
  
  <!-- Generate the opening -->
  <LLM output="opening" maxTokens="150">
    Write the opening paragraph of a story about ${character} in ${setting}.
    End with a cliffhanger.
  </LLM>
  <output>${opening}&#10;&#10;</output>
  
  <!-- Generate 3 story beats -->
  <defvar name="context" value="${opening}" />
  
  <loop var="i" from="1" to="3">
    <output>--- Part ${i} ---&#10;</output>
    
    <LLM output="nextPart" maxTokens="150">
      Continue this story with the next paragraph:
      
      ${context}
      
      Make it exciting and end with a cliffhanger.
    </LLM>
    
    <output>${nextPart}&#10;&#10;</output>
    
    <!-- Update context for next iteration -->
    <assign name="context" value="${context} ${nextPart}" />
  </loop>
  
  <!-- Generate conclusion -->
  <output>--- Conclusion ---&#10;</output>
  <LLM output="ending" maxTokens="150">
    Write a satisfying conclusion to this story:
    
    ${context}
    
    Wrap up the plot in 2-3 sentences.
  </LLM>
  <output>${ending}&#10;</output>
</dirac>

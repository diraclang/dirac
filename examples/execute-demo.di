<!-- Simple Execute Demo - LLM generates and executes code -->
<dirac>
  <output>Demo: LLM-Generated Executable Code&#10;&#10;</output>
  
  <!-- Simple calculation task -->
  <output>Task: Calculate 15 * 23 + 7&#10;</output>
  <LLM output="mathCode" maxTokens="150">
    Generate Dirac XML to calculate: 15 * 23 + 7
    
    Format:
    &lt;dirac&gt;
      &lt;eval name="result"&gt;return 15 * 23 + 7;&lt;/eval&gt;
      &lt;output&gt;Result: ${result}&lt;/output&gt;
    &lt;/dirac&gt;
    
    Return only XML, no markdown.
  </LLM>
  
  <execute source="mathCode" />
  <output>&#10;</output>
  
  <!-- File listing task -->
  <output>Task: Count files in current directory&#10;</output>
  <LLM output="fileCode" maxTokens="150">
    Generate Dirac XML to count files in current directory.
    
    Format:
    &lt;dirac&gt;
      &lt;eval name="count"&gt;return fs.readdirSync('.').length;&lt;/eval&gt;
      &lt;output&gt;Files: ${count}&lt;/output&gt;
    &lt;/dirac&gt;
    
    Return only XML, no markdown.
  </LLM>
  
  <execute source="fileCode" />
  <output>&#10;Done!&#10;</output>
</dirac>

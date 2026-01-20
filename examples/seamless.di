<!-- Seamless LLM-Dirac Interleaving - THE PHILOSOPHICAL DEMO -->
<dirac>
  <output>Seamless Execution Demo&#10;&#10;</output>
  
  <!-- Define a subroutine that lists files -->
  <subroutine name="LIST_FILES">
    <eval name="files">
      return fs.readdirSync('examples')
        .filter(f => f.endsWith('.di'))
        .slice(0, 5)
        .join(', ');
    </eval>
    <output>Files found: ${files}&#10;</output>
  </subroutine>
  
  <!-- Define a subroutine that counts something -->
  <subroutine name="COUNT_FILES">
    <eval name="count">
      return fs.readdirSync('examples').filter(f => f.endsWith('.di')).length;
    </eval>
    <output>Total count: ${count}&#10;</output>
  </subroutine>
  
  <!-- Now the magic: LLM returns Dirac tags that get executed immediately -->
  <output>Asking LLM to analyze and respond with executable tags...&#10;&#10;</output>
  
  <LLM execute="true" maxTokens="200">
    You are analyzing a project directory. 
    
    Respond by calling ONLY these Dirac subroutines (XML tags):
    - &lt;LIST_FILES /&gt; - lists example files
    - &lt;COUNT_FILES /&gt; - counts total files
    
    Your response should be pure XML like:
    &lt;dirac&gt;
      &lt;output&gt;Analysis:&#10;&lt;/output&gt;
      &lt;LIST_FILES /&gt;
      &lt;COUNT_FILES /&gt;
    &lt;/dirac&gt;
    
    Return ONLY the XML, no explanation.
  </LLM>
  
  <output>&#10;Done!&#10;</output>
</dirac>

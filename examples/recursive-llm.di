<!-- Recursive LLM-Dirac Interleaving (LISP Style) -->
<dirac>
  <output>Recursive Execution Demo&#10;&#10;</output>
  
  <!-- Define subroutines that can be called by LLM -->
  <subroutine name="GET_FILE_COUNT">
    <eval name="count">
      return fs.readdirSync('examples').filter(f => f.endsWith('.di')).length;
    </eval>
    <output>File count: ${count}&#10;</output>
  </subroutine>
  
  <subroutine name="GET_FILE_NAMES">
    <eval name="names">
      return fs.readdirSync('examples')
        .filter(f => f.endsWith('.di'))
        .slice(0, 3)
        .join(', ');
    </eval>
    <output>Sample files: ${names}&#10;</output>
  </subroutine>
  
  <subroutine name="ANALYZE_DEEPER">
    <output>Deep analysis requested...&#10;</output>
    <!-- This subroutine itself calls an LLM! Recursion! -->
    <LLM execute="true" maxTokens="80">
      Return XML: &lt;dirac&gt;&lt;output&gt;Analysis complete!&#10;&lt;/output&gt;&lt;/dirac&gt;
    </LLM>
  </subroutine>
  
  <!-- Level 1: User calls LLM -->
  <output>Level 1: Asking LLM to analyze...&#10;</output>
  <LLM execute="true" maxTokens="150">
    Return ONLY XML calling these subroutines:
    &lt;dirac&gt;
      &lt;output&gt;Starting analysis...&#10;&lt;/output&gt;
      &lt;GET_FILE_COUNT /&gt;
      &lt;GET_FILE_NAMES /&gt;
      &lt;ANALYZE_DEEPER /&gt;
    &lt;/dirac&gt;
  </LLM>
  
  <output>&#10;All levels complete!&#10;</output>
</dirac>

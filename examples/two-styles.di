<!-- Comparing Two Styles of LLM-Code Execution -->
<dirac>
  <output>=== Style Comparison Demo ===&#10;&#10;</output>
  
  <!-- STYLE 1: EXPLICIT (Clear, Debuggable) -->
  <output>--- Explicit Style (Clarity) ---&#10;</output>
  <LLM output="generatedCode" maxTokens="100">
    Return ONLY this XML, nothing else:
    &lt;dirac&gt;&lt;eval name="result"&gt;return 10 + 20;&lt;/eval&gt;&lt;output&gt;Sum: ${result}&lt;/output&gt;&lt;/dirac&gt;
  </LLM>
  
  <output>Generated code:&#10;${generatedCode}&#10;&#10;</output>
  <output>Executing...&#10;</output>
  <execute source="generatedCode" />
  <output>&#10;&#10;</output>
  
  <!-- STYLE 2: LISP (Seamless, Direct) -->
  <output>--- LISP Style (Seamless) ---&#10;</output>
  <LLM execute="true" maxTokens="100">
    Return ONLY this XML, nothing else:
    &lt;dirac&gt;&lt;eval name="result"&gt;return 30 + 40;&lt;/eval&gt;&lt;output&gt;Sum: ${result}&lt;/output&gt;&lt;/dirac&gt;
  </LLM>
  <output>&#10;</output>
  
  <output>--- When to Use Each ---&#10;</output>
  <output>Explicit: Debugging, inspection, conditional execution&#10;</output>
  <output>LISP: Real-time interaction, streaming, recursive calls&#10;</output>
</dirac>

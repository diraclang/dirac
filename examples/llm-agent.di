<!-- Agent with LLM-generated operations -->
<dirac>
  <defvar name="task" value="create a hello world file named greeting.txt" />
  
  <output>Task: ${task}&#10;&#10;</output>
  
  <!-- Ask LLM to generate Dirac code to accomplish the task -->
  <output>Asking LLM to generate executable code...&#10;</output>
  <LLM output="generatedCode" maxTokens="400">
    You are a Dirac code generator. Generate valid Dirac XML to accomplish this task:
    "${task}"
    
    Available tags:
    - &lt;dirac&gt; (root element)
    - &lt;defvar name="x" value="y" /&gt; (define variable)
    - &lt;output&gt;text&lt;/output&gt; (print output)
    - &lt;eval name="result"&gt;JavaScript code&lt;/eval&gt; (run JS, has fs and path modules)
    
    The eval tag can use fs.writeFileSync(filename, content) to write files.
    Variables are accessed as plain JavaScript variables (not with ${}).
    
    Return ONLY valid Dirac XML starting with &lt;dirac&gt; tag. No explanations.
  </LLM>
  
  <output>&#10;Generated code:&#10;${generatedCode}&#10;&#10;</output>
  
  <!-- Execute the LLM-generated code -->
  <output>Executing generated code...&#10;</output>
  <execute source="generatedCode" />
  
  <output>&#10;Task completed!&#10;</output>
</dirac>

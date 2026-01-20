<!-- Advanced Agent - Natural language to operations -->
<dirac>
  <output>Interactive Agent Example&#10;&#10;</output>
  
  <!-- Task 1: File operations -->
  <defvar name="userRequest" value="count how many .di files are in examples directory" />
  
  <output>Request: ${userRequest}&#10;</output>
  <LLM output="code1" maxTokens="300">
    Generate Dirac XML to: ${userRequest}
    
    Use these tags ONLY:
    1. &lt;eval name="varname"&gt;return javascriptExpression;&lt;/eval&gt;
    2. &lt;output&gt;text with ${varname}&lt;/output&gt;
    
    Example:
    &lt;dirac&gt;
      &lt;eval name="result"&gt;return fs.readdirSync('examples').filter(f =&gt; f.endsWith('.di')).length;&lt;/eval&gt;
      &lt;output&gt;Count: ${result}&lt;/output&gt;
    &lt;/dirac&gt;
    
    Return only XML, no markdown or explanations.
  </LLM>
  
  <output>Executing...&#10;</output>
  <execute source="code1" />
  <output>&#10;&#10;</output>
  
  <!-- Task 2: Data processing -->
  <assign name="userRequest" value="create a JSON file with current date and time" />
  
  <output>Request: ${userRequest}&#10;</output>
  <LLM output="code2" maxTokens="300">
    Generate Dirac XML to: ${userRequest}
    
    Available:
    - &lt;eval name="var"&gt;return jsExpression&lt;/eval&gt; (MUST use 'return', fs and path available, can use Date)
    - &lt;output&gt;text ${variable}&lt;/output&gt;
    
    IMPORTANT: Every eval MUST have 'return' statement.
    Return only &lt;dirac&gt; XML, no markdown. Name the file timestamp.json.
  </LLM>
  
  <output>Executing...&#10;</output>
  <execute source="code2" />
  <output>&#10;</output>
</dirac>

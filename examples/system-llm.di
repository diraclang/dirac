<dirac>
  <!-- Get file listing -->
  <defvar name="dir">examples</defvar>
  <output>Getting file listing from ${dir}...</output>
  <output>&#10;</output>
  
  <llm output="fileList">
    <system>ls -lh ${dir} | head -10</system>
    
    Above is a directory listing. Please analyze it and tell me:
    1. How many files are shown?
    2. What is the total size of the largest file?
    3. What file types do you see (by extension)?
    
    Please be concise.
  </llm>
  
  <output>&#10;&#10;LLM Analysis:</output>
  <output>&#10;</output>
  <output><variable name="fileList"/></output>
</dirac>

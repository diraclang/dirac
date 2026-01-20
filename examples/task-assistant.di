<!-- Task Assistant - LLM breaks down and executes tasks -->
<dirac>
  <defvar name="task" value="organize a birthday party" />
  
  <output>Task: ${task}&#10;&#10;</output>
  
  <!-- Ask LLM to break down the task -->
  <output>Breaking down the task...&#10;</output>
  <LLM output="steps" maxTokens="300">
    Break down "${task}" into 3-5 concrete action steps.
    Return ONLY a numbered list, one step per line.
    Keep each step brief and actionable.
  </LLM>
  
  <output>&#10;Steps to complete:&#10;${steps}&#10;&#10;</output>
  
  <!-- Now get LLM to provide tips for the first step -->
  <output>Getting tips for step 1...&#10;</output>
  <LLM output="tips" maxTokens="200">
    For the first step in this list:
    ${steps}
    
    Provide 2-3 quick practical tips. Be concise.
  </LLM>
  
  <output>&#10;Tips:&#10;${tips}&#10;</output>
</dirac>

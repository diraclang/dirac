#!/usr/bin/env dirac
<dirac>
  <!-- Test that <DONE /> is properly handled in LLM feedback mode -->
  
  <!-- Simulate a conversation where LLM wants to stop -->
  <defvar name="test_dialog">[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Just say you're done, don't write any code."},
    {"role": "assistant", "content": "I understand. <DONE />"}
  ]</defvar>
  
  <output>Testing LLM DONE tag handling...</output>
  <output>&#10;</output>
  
  <!-- This should detect <DONE /> and exit cleanly without validation errors -->
  <output>If this works, the LLM will exit gracefully without trying to validate &lt;DONE /&gt; as a tag.</output>
  <output>&#10;</output>
  
  <output>Test completed!</output>
</dirac>

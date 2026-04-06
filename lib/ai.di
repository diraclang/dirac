<!-- Exported subroutine -->

<subroutine name="ai" 
  description="AI assistant with context loading (internal wrapper - use llm tag directly instead)"
  meta-hide-from-llm="true"
  visible="subroutine">

   <load-context>
    <parameters select="*" />
   </load-context>

  <llm execute="true" save-dialog="true" show="boundary">
      <parameters select="*" />
  </llm>
  
  <!-- Load context and store results in a variable -->
<!--
  <load-context output="context_result">
    <parameters select="*" />
  </load-context>
-->
  
  <!-- Use Anthropic when context is found (more powerful for RAG) -->
  <!-- Use Ollama when no context (faster for simple queries) -->
<!--
  <test-if test="$context_result" eq="">
    <output file="/tmp/ai.log">Used anthropic</output>
    <llm execute="true" save-dialog="true" provider="anthropic">
      <parameters select="*" />
    </llm>
  </test-if>
  
  <test-if test="$context_result" ne="">
  <output file="/tmp/ai.log">Used local ollama</output>
    <llm execute="true" save-dialog="true" provider="ollama">
      <parameters select="*" />
    </llm>
  </test-if>
-->

</subroutine>

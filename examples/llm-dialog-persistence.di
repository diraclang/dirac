<!-- Example: LLM Dialog Persistence with save-dialog flag -->
<!-- Demonstrates how dialog context is preserved across multiple LLM calls -->

<dirac>
  <output>===== LLM Dialog Persistence Example =====</output>
  <output></output>
  
  <!-- First call: Full system prompt is sent -->
  <output>1. First LLM call (no context):</output>
  <llm save-dialog="true" execute="true">
    Create a subroutine called "greet" that takes a name parameter
    and outputs "Hello, [name]!"
  </llm>
  
  <output></output>
  <output>2. Testing the generated subroutine:</output>
  <greet name="Alice" />
  
  <output></output>
  
  <!-- Second call: Only updated subroutines are sent, dialog is preserved -->
  <output>3. Second LLM call (with dialog context):</output>
  <llm save-dialog="true" execute="true">
    Now create another subroutine called "farewell" that says goodbye
  </llm>
  
  <output></output>
  <output>4. Testing both subroutines:</output>
  <greet name="Bob" />
  <farewell name="Bob" />
  
  <output></output>
  
  <!-- Third call: Continue the conversation -->
  <output>5. Third LLM call (continuing conversation):</output>
  <llm save-dialog="true" execute="true">
    Modify the greet subroutine to be more enthusiastic with exclamation marks
  </llm>
  
  <output></output>
  <output>6. Testing updated subroutine:</output>
  <greet name="Charlie" />
  
  <output></output>
  <output>===== Example Complete =====</output>
</dirac>

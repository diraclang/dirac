<!-- Example: Named Context Variable for Multiple Conversations -->
<!-- Demonstrates using context="variable_name" for explicit dialog management -->

<dirac>
  <output>===== Named Context Variables Example =====</output>
  <output></output>
  
  <!-- Conversation A: Code generation -->
  <output>Conversation A - Code Generation:</output>
  <llm context="conversation_a" execute="true">
    Create a subroutine "add" that adds two numbers
  </llm>
  
  <output>Testing add: </output>
  <add x="5" y="3" />
  
  <output></output>
  
  <!-- Conversation B: Different topic -->
  <output>Conversation B - Text Processing:</output>
  <llm context="conversation_b" execute="true">
    Create a subroutine "uppercase" that converts text to uppercase
  </llm>
  
  <output>Testing uppercase: </output>
  <uppercase text="hello world" />
  
  <output></output>
  
  <!-- Continue Conversation A -->
  <output>Back to Conversation A:</output>
  <llm context="conversation_a" execute="true">
    Now create a "multiply" subroutine
  </llm>
  
  <output>Testing multiply: </output>
  <multiply x="4" y="7" />
  
  <output></output>
  
  <!-- Continue Conversation B -->
  <output>Back to Conversation B:</output>
  <llm context="conversation_b" execute="true">
    Create a "lowercase" subroutine too
  </llm>
  
  <output>Testing lowercase: </output>
  <lowercase text="HELLO WORLD" />
  
  <output></output>
  <output>===== Two Separate Conversations Maintained =====</output>
</dirac>

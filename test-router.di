<!-- Test router factory pattern -->

<!-- Define a simple router factory -->
<subroutine name="test-router-factory" visible="subroutine">
  <subroutine name="simple-router" visible="subroutine">
    <output>This is a custom system prompt from the router.

You are a helpful assistant. Generate only XML code.

Available tags: output, defvar, variable</output>
  </subroutine>
</subroutine>

<!-- Test 1: Register the router -->
<output>Test 1: Registering router...</output>
<test-router-factory/>
<output>Router registered.</output>

<!-- Test 2: Use router with LLM (will show what system prompt is used in debug mode) -->
<output>
Test 2: Calling LLM with router attribute...
</output>

<llm router="simple-router" noextra="true">
Say hello
</llm>

<output>
Test complete.
</output>

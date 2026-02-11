<!-- TEST: llm_execute_with_validation -->
<!-- EXPECT: Background color is: blue -->

<dirac>
  <subroutine name="set-color" 
              description="Set a background color"
              param-color="string:required:Color name">
    <parameters select="@color"/>
    <output>Background color is: <variable name="color" /></output>
  </subroutine>

  <!-- Test: LLM with execute=true and validate=true should work -->
  <!-- This tests that DIRAC-ROOT wrapper tag is properly skipped during validation -->
  <llm execute="true" validate="true" maxTokens="100">
    Set the background color to blue
  </llm>
</dirac>

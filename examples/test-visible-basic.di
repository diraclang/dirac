<!-- Test: Can we see subroutines after they're defined? -->

<!-- Define a test subroutine -->
<subroutine name="TEST_HELPER" 
            param-message="string:required:message to display"
            description="A test helper subroutine">
  <output>Helper says: <parameters select="*" /></output>
</subroutine>

<!-- Check what's available -->
<output>Available subroutines after definition:</output>
<available-subroutines />

<!-- Call it -->
<output>
Calling TEST_HELPER:
</output>
<TEST_HELPER>Hello World</TEST_HELPER>

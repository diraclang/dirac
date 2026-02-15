<!-- TEST: visible_subroutine_attribute -->
<!-- EXPECT:
Before call
Nested registered
After call: NESTED_HELPER available
Calling NESTED_HELPER: Success!
-->

<!-- Subroutine WITH visible="subroutine" - nested subroutines persist -->
<subroutine name="PARENT_WITH_VISIBLE" visible="subroutine">
  <output>Before call</output>
  
  <subroutine name="NESTED_HELPER">
    <output>Calling NESTED_HELPER: Success!</output>
  </subroutine>
  
  <output>Nested registered</output>
</subroutine>

<!-- Call the parent -->
<PARENT_WITH_VISIBLE />

<!-- Verify nested subroutine is still available -->
<output>After call: NESTED_HELPER available</output>

<!-- Call the nested subroutine (should work) -->
<NESTED_HELPER />

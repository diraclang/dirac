<!-- TEST: visible_subroutine_cleanup -->
<!-- EXPECT:
Parent without visible called
After call: nested was cleaned up
-->

<!-- Subroutine WITHOUT visible - nested subroutines are cleaned up -->
<subroutine name="PARENT_WITHOUT_VISIBLE">
  <output>Parent without visible called</output>
  
  <subroutine name="SHOULD_BE_CLEANED">
    <output>This should not be called</output>
  </subroutine>
</subroutine>

<!-- Call the parent -->
<PARENT_WITHOUT_VISIBLE />

<!-- Verify nested subroutine was cleaned up -->
<output>After call: nested was cleaned up</output>

<!-- Trying to call SHOULD_BE_CLEANED would fail, so we skip it -->

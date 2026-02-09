<!-- TEST: try_catch_basic -->
<!-- EXPECT: Caught error: -->
<dirac>
  <try>
    <throw message="Division by zero" />
  </try>
  <catch>
    <output>Caught error: <variable name="error" /></output>
  </catch>
</dirac>

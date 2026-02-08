<!-- TEST: try_catch_eval_error -->
<!-- EXPECT_ERROR: Test error -->
<dirac>
  <try>
    <eval>throw new Error("Test error");</eval>
  </try>
  <catch>
    <output>Caught error</output>
  </catch>
</dirac>

<!-- TEST: exception_handling -->
<!-- EXPECT: Caught: test error -->
<dirac>
  <try>
    <throw name="test_exception">test error</throw>
  </try>
  <catch name="test_exception">
    <output>Caught: <exception /></output>
  </catch>
</dirac>

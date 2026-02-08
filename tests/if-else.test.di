<!-- TEST: if_else -->
<!-- EXPECT: Value is small -->
<dirac>
  <defvar name="num" value="5" />
  <test-if test="$num > 10">
    <output>Value is large</output>
  </test-if>
  <test-if test="$num <= 10">
    <output>Value is small</output>
  </test-if>
</dirac>

<!-- TEST: test-if_attribute_based -->
<!-- EXPECT: Greater! -->
<dirac>
  <defvar name="x" value="10" />
  <test-if test="$x" gt="5">
    <output>Greater!</output>
  </test-if>
</dirac>

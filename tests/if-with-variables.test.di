<!-- TEST: if_with_variables -->
<!-- EXPECT: Match found -->
<dirac>
  <defvar name="status" value="active" />
  <test-if test="$status == active">
    <output>Match found</output>
  </test-if>
</dirac>

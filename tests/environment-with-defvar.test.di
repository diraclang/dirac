<!-- TEST: environment_with_defvar -->
<!-- EXPECT: Path exists: true -->
<dirac>
  <defvar name="mypath">
    <environment name="PATH" />
  </defvar>
  
  <output>Path exists: </output>
  <test-if test="$mypath != ''">
    <output>true</output>
  </test-if>
  <test-if test="$mypath == ''">
    <output>false</output>
  </test-if>
</dirac>

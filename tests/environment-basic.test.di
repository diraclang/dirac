<!-- TEST: environment_basic -->
<!-- EXPECT: HOME exists: true USER exists: true -->
<dirac>
  <defvar name="home"><environment name="HOME" /></defvar>
  <defvar name="user"><environment name="USER" /></defvar>
  
  <output>HOME exists: </output>
  <test-if test="$home != ''">
    <output>true</output>
  </test-if>
  <test-if test="$home == ''">
    <output>false</output>
  </test-if>
  
  <output> USER exists: </output>
  <test-if test="$user != ''">
    <output>true</output>
  </test-if>
  <test-if test="$user == ''">
    <output>false</output>
  </test-if>
</dirac>

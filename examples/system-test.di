<dirac>
  <!-- Test 1: Simple command -->
  <output>Current directory:</output>
  <output>&#10;</output>
  <system>pwd</system>
  <output>&#10;</output>
  
  <!-- Test 2: Command with variable substitution -->
  <defvar name="dir">examples</defvar>
  <output>Files in <variable name="dir" />:</output>
  <output>&#10;</output>
  <system>ls -la <variable name="dir" /> | head -50</system>
</dirac>

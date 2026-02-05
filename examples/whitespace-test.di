<dirac>
  <defvar name="dir">examples</defvar>
  
  <output>Test 1 - Text with variable inline:</output>
  <output>&#10;</output>
  <output>Files in <variable name="dir" />:</output>
  <output>&#10;</output>
  <output>&#10;</output>
  
  <output>Test 2 - System tag with variable:</output>
  <output>&#10;</output>
  <system>echo "ls -la <variable name="dir" />"</system>
  <output>&#10;</output>
  
  <output>Test 3 - Output tag content only:</output>
  <output>&#10;</output>
  <output>Files in examples:</output>
  <output>&#10;</output>
  
  <output>Test 4 - Variable value alone:</output>
  <output>&#10;</output>
  <variable name="dir" />
  <output>&#10;</output>
</dirac>

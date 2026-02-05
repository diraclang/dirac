<dirac>
  <output>Current directory:</output>
  <system>pwd</system>
  <defvar name="dir">examples</defvar>
  <output>Files in <variable name="dir" />:</output>

  <system>ls -la <variable name="dir" /> | head -5</system>
</dirac>

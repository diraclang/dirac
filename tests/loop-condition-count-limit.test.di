<!-- Test: combined count and condition, stops at count limit -->
<dirac>
  <defvar name="running" value="true" />
  <defvar name="result" value="" />
  
  <loop count="3" condition="${running}">
    <assign name="result">
      <variable name="result" />x
    </assign>
  </loop>
  
  <output><variable name="result" /></output>
</dirac>

<!-- Expected output: xxx -->
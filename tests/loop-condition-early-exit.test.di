<!-- Test: combined count and condition, stops when condition becomes false before count reached -->
<dirac>
  <defvar name="running" value="true" />
  <defvar name="result" value="" />
  
  <loop count="10" condition="${running}">
    <assign name="result">
      <variable name="result" />x
    </assign>
    <if condition="${i} == 2">
      <assign name="running" value="false" />
    </if>
  </loop>
  
  <output><variable name="result" /></output>
</dirac>

<!-- Expected output: xxx (stops at iteration 2 due to condition) -->
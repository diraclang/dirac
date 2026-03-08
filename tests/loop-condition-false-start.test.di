<!-- Test: condition false from start, loop body never executes -->
<dirac>
  <defvar name="shouldRun" value="false" />
  <defvar name="result" value="not executed" />
  
  <loop condition="${shouldRun}">
    <assign name="result" value="executed" />
  </loop>
  
  <output><variable name="result" /></output>
</dirac>

<!-- Expected output: not executed -->
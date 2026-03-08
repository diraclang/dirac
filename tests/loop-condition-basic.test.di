<!-- Test: condition-based loop stops when condition becomes false -->
<dirac>
  <defvar name="counter" value="0" />
  <defvar name="running" value="true" />
  <defvar name="result" value="" />
  
  <loop condition="${running}">
    <assign name="result">
      <variable name="result" />x
    </assign>
    <assign name="counter">
      <expr eval="plus">
        <arg><variable name="counter" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <if condition="${counter} == 5">
      <assign name="running" value="false" />
    </if>
  </loop>
  
  <output><variable name="result" /></output>
</dirac>

<!-- Expected output: xxxxx -->
<!-- Test: monitoring/service pattern with condition loop -->
<dirac>
  <defvar name="checks" value="0" />
  <defvar name="running" value="true" />
  <defvar name="log" value="" />
  
  <loop condition="${running}">
    <assign name="log">
      <variable name="log" />check<variable name="checks" />;
    </assign>
    <assign name="checks">
      <expr eval="plus">
        <arg><variable name="checks" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <if condition="${checks} == 5">
      <assign name="running" value="false" />
    </if>
  </loop>
  
  <output><variable name="log" /></output>
</dirac>

<!-- Expected output: check0;check1;check2;check3;check4; -->
<!-- Test: break statement works with condition-based loop -->
<dirac>
  <defvar name="running" value="true" />
  <defvar name="count" value="0" />
  
  <loop condition="${running}">
    <assign name="count">
      <expr eval="plus">
        <arg><variable name="count" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <if condition="${count} == 3">
      <break />
    </if>
  </loop>
  
  <output><variable name="count" /></output>
</dirac>

<!-- Expected output: 3 -->
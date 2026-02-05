<dirac>
  <output>Test</output>
  <defvar name="x" value="5"/>
  <if>
    <cond eval="eq">
      <arg><variable name="x"/></arg>
      <arg>5</arg>
    </cond>
    <then>
      <output>Match</output>
    </then>
  </if>
</dirac>

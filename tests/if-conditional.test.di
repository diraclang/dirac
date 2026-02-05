<!-- TEST: if_conditional_true -->
<!-- EXPECT: Match! -->
<dirac>
  <defvar name="x" value="5" />
  <if>
    <cond eval="eq">
      <arg><variable name="x" /></arg>
      <arg>5</arg>
    </cond>
    <then>
      <output>Match!</output>
    </then>
    <else>
      <output>No match!</output>
    </else>
  </if>
</dirac>

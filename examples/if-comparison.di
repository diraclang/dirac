<dirac>
  <output>====== Comparing IF and TEST-IF ======</output>
  <output>
</output>
  
  <defvar name="score" value="85"/>
  
  <output>--- Using C-style IF ---</output>
  <if>
    <cond eval="ge">
      <arg><variable name="score"/></arg>
      <arg>80</arg>
    </cond>
    <then>
      <output>Grade: B or better (score >= 80)</output>
    </then>
    <else>
      <output>Grade: Below B (score < 80)</output>
    </else>
  </if>
  <output>
</output>
  
  <output>--- Using TEST-IF (equivalent, no else) ---</output>
  <test-if test="$score" ge="80">
    <output>Grade: B or better (score >= 80)</output>
  </test-if>
  <output>
</output>
  
  <output>--- Nested conditionals with IF ---</output>
  <defvar name="temp_score" value="85"/>
  <if>
    <cond eval="ge">
      <arg><variable name="temp_score"/></arg>
      <arg>80</arg>
    </cond>
    <then>
      <output>Good job! (B grade or better)</output>
    </then>
    <else>
      <output>Keep working! (below B)</output>
    </else>
  </if>
  <output>
</output>
  
  <output>--- Multiple TEST-IF conditions ---</output>
  <test-if test="$score" ge="90">
    <output>Excellent! (A grade)</output>
  </test-if>
  <test-if test="$score" lt="90">
    <test-if test="$score" ge="80">
      <output>Good job! (B grade)</output>
    </test-if>
  </test-if>
  <test-if test="$score" lt="80">
    <output>Keep working! (C or below)</output>
  </test-if>
  <output>
</output>
  
  <output>--- String comparison with IF ---</output>
  <defvar name="status" value="active"/>
  <if>
    <cond eval="eq">
      <arg><variable name="status"/></arg>
      <arg>active</arg>
    </cond>
    <then>
      <output>System is active</output>
    </then>
    <else>
      <output>System is not active</output>
    </else>
  </if>
  <output>
</output>
  
  <output>--- String comparison with TEST-IF ---</output>
  <test-if test="$status" eq="active">
    <output>System is active</output>
  </test-if>
  <test-if test="$status" ne="active">
    <output>System is not active</output>
  </test-if>
  <output>
</output>
  
  <output>====== Comparison Complete ======</output>
</dirac>

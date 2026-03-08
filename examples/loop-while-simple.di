<!-- 
  Simple condition loop example
  Demonstrates while-loop style iteration
-->
<dirac>
  <output>Counting until we find a match...</output>
  
  <defvar name="found" value="false" />
  <defvar name="count" value="0" />
  
  <!-- While loop: continue until found is true -->
  <loop condition="${found} == false">
    <assign name="count">
      <expr eval="plus">
        <arg><variable name="count" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    
    <output>Attempt <variable name="count" /></output>
    
    <!-- Simulate finding something after 5 attempts -->
    <if condition="${count} == 5">
      <assign name="found" value="true" />
      <output>Found it!</output>
    </if>
  </loop>
  
  <output>
Total attempts: <variable name="count" />
  </output>
</dirac>
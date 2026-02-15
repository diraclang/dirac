<!-- Test break with condition -->
<loop count="10">
  <test-if test="$i" ge="3">
    <output>Breaking at i=<variable name="i" /></output>
    <break />
  </test-if>
  
  <output>Loop iteration: <variable name="i" /></output>
</loop>

<output>After loop</output>

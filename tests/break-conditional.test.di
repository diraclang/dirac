<!-- TEST: break_tag_conditional -->
<!-- EXPECT:
Loop: 0
Loop: 1
Loop: 2
Breaking at 3
After loop
-->

<loop count="10">
  <test-if test="$i" ge="3">
    <output>Breaking at <variable name="i" /></output>
    <break />
  </test-if>
  <output>Loop: <variable name="i" /></output>
</loop>
<output>After loop</output>

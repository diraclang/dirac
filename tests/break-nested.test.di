<!-- TEST: break_tag_nested_loops -->
<!-- EXPECT:
Outer: 0, Inner: 0
Outer: 0, Inner: 1
Outer: 0, break inner at 2
Outer: 1, Inner: 0
Outer: 1, Inner: 1
Outer: 1, break inner at 2
Outer: 2, Inner: 0
Outer: 2, Inner: 1
Outer: 2, break inner at 2
Done
-->

<loop count="3" var="outer">
  <loop count="5" var="inner">
    <test-if test="$inner" ge="2">
      <output>Outer: <variable name="outer" />, break inner at <variable name="inner" /></output>
      <break />
    </test-if>
    <output>Outer: <variable name="outer" />, Inner: <variable name="inner" /></output>
  </loop>
</loop>
<output>Done</output>

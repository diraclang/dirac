<!-- TEST: break_tag_basic -->
<!-- EXPECT:
Before break
Done
-->

<loop count="5">
  <output>Before break</output>
  <break />
  <output>Should not print</output>
</loop>
<output>Done</output>

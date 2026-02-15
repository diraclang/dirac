<!-- TEST: loop_with_variable_count -->
<!-- EXPECT:
0
1
2
-->

<defvar name="loopCount">3</defvar>
<loop count="${loopCount}">
  <output><variable name="i" /></output>
</loop>

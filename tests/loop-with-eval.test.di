<!-- TEST: loop_with_eval -->
<!-- EXPECT: 0 2 4 -->
<dirac>
  <loop count="3" var="i">
    <eval name="doubled">return parseInt(i) * 2;</eval>
    <output><variable name="doubled" /></output>
  </loop>
</dirac>

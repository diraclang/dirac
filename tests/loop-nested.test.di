<!-- TEST: loop_nested -->
<!-- EXPECT: 0-A 0-B 1-A 1-B -->
<dirac>
  <loop count="2" var="i">
    <loop count="2" var="j">
      <eval name="letter">return j === 0 ? 'A' : 'B';</eval>
      <output><variable name="i" />-<variable name="letter" /> </output>
    </loop>
  </loop>
</dirac>

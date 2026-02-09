<!-- TEST: call_basic -->
<!-- EXPECT: Square of 5 is: 25 -->
<dirac>
  <subroutine name="square" param-x="number">
    <eval name="result">return parseInt(x) * parseInt(x);</eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <output>Square of 5 is: </output>
  <call name="square" x="5" />
</dirac>

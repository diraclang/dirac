<!-- TEST: call_with_output -->
<!-- EXPECT: 100 -->
<dirac>
  <subroutine name="square" param-x="number">
    <eval name="result">return parseInt(x) * parseInt(x);</eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <call name="square" x="10" />
</dirac>

<!-- TEST: eval_basic -->
<!-- EXPECT: Calculated: 42 -->
<dirac>
  <eval name="result">return 6 * 7;</eval>
  <output>Calculated: <variable name="result" /></output>
</dirac>

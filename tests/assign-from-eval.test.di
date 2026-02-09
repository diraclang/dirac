<!-- TEST: assign_from_eval -->
<!-- EXPECT: Result: 15 -->
<dirac>
  <defvar name="result" value="0" />
  <eval name="result">return 10 + 5;</eval>
  <output>Result: <variable name="result" /></output>
</dirac>

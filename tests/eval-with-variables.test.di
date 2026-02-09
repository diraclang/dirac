<!-- TEST: eval_with_variables -->
<!-- EXPECT: Sum: 30 -->
<dirac>
  <defvar name="a" value="10" />
  <defvar name="b" value="20" />
  <eval name="sum">return parseInt(a) + parseInt(b);</eval>
  <output>Sum: <variable name="sum" /></output>
</dirac>

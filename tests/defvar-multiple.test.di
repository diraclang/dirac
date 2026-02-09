<!-- TEST: defvar_multiple -->
<!-- EXPECT: a=1, b=2, c=3 -->
<dirac>
  <defvar name="a" value="1" />
  <defvar name="b" value="2" />
  <defvar name="c" value="3" />
  <output>a=<variable name="a" />, b=<variable name="b" />, c=<variable name="c" /></output>
</dirac>

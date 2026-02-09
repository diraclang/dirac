<!-- TEST: expr_basic -->
<!-- EXPECT: Result: 15 -->
<dirac>
  <defvar name="a" value="10" />
  <defvar name="b" value="5" />
  <output>Result: </output>
  <expr eval="plus">
    <arg><variable name="a" /></arg>
    <arg><variable name="b" /></arg>
  </expr>
</dirac>

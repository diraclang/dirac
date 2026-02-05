<!-- TEST: variable_definition_and_output -->
<!-- EXPECT: Value is: test123 -->
<dirac>
  <defvar name="myvar" value="test123" />
  <output>Value is: <variable name="myvar" /></output>
</dirac>

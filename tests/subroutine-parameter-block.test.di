<!-- TEST: subroutine_parameter_block -->
<!-- EXPECT: Hello Alice -->
<dirac>
  <subroutine name="greet">
    <parameters>
      <param name="prefix" type="string" required="true" description="Greeting prefix" />
    </parameters>
    <output><variable name="prefix" /> <parameters select="*" /></output>
  </subroutine>

  <greet prefix="Hello">Alice</greet>
</dirac>
<!-- TEST: extend_with_parameters -->
<!-- EXPECT: Hello, World -->  
<dirac>
  <subroutine name="greet" param-name="string:required">
    <output>Hello, </output>
    <output><variable name="name" /></output>
  </subroutine>
  
  <subroutine name="greet" extends="greet" param-name="string:required">
    <!-- Child body is not executed with extends, only nested subroutines override -->
  </subroutine>
  
  <greet name="World" />
</dirac>

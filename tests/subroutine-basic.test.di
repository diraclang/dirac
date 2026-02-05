<!-- TEST: subroutine_call -->
<!-- EXPECT: Hello, Alice! -->
<dirac>
  <subroutine name="greet" param-name="string">
    <output>Hello, <variable name="name" />!</output>
  </subroutine>
  
  <greet name="Alice" />
</dirac>

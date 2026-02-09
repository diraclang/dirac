<!-- TEST: subroutine_multiple_params -->
<!-- EXPECT: John Doe -->
<dirac>
  <subroutine name="fullname" param-first="string" param-last="string">
    <eval name="result">return first + ' ' + last;</eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <call name="fullname" first="John" last="Doe" />
</dirac>

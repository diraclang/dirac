<dirac>
  <subroutine name="test" param-x="number">
    <output>In subroutine, x=<variable name="x" /></output>
  </subroutine>
  
  <output>Before call</output>
  <call name="test" x="5" />
  <output>After call</output>
</dirac>

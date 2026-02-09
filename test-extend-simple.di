<dirac>
  <subroutine name="parent">
    <output>Parent body</output>
  </subroutine>
  
  <subroutine name="child" extends="parent">
    <output>Child body</output>
  </subroutine>
  
  <call name="child" />
</dirac>

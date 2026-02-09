<dirac>
  <subroutine name="parent">
    <subroutine name="nested">
      <output>Parent nested</output>
    </subroutine>
    <output>In parent, calling: </output>
    <call name="nested" />
  </subroutine>
  
  <subroutine name="child" extends="parent">
    <subroutine name="nested">
      <output>Child nested</output>
    </subroutine>
  </subroutine>
  
  <call name="child" />
</dirac>

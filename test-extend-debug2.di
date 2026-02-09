<dirac>
  <!-- Simplified test -->
  <subroutine name="parent">
    <output>In parent, calling nested: </output>
    <call name="nested" />
  </subroutine>
  
  <subroutine name="child" extends="parent">
    <subroutine name="nested">
      <output>Child's nested</output>
    </subroutine>
  </subroutine>
  
  <call name="child" />
</dirac>

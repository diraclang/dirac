<dirac>
  <!-- Base who subroutine -->
  <subroutine name="who">
    <subroutine name="_operation">
      <output>Base operation</output>
    </subroutine>
    <output>Who: </output>
    <call name="_operation" />
  </subroutine>
  
  <!-- First extension - self-extend -->
  <subroutine name="who" extend="">
    <subroutine name="_operation">
      <output>First extension</output>
    </subroutine>
  </subroutine>
  
  <!-- Second extension - self-extend -->
  <subroutine name="who" extend="">
    <subroutine name="_operation">
      <output>Second extension</output>
    </subroutine>
  </subroutine>
  
  <call name="who" />
</dirac>

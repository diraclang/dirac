<dirac>
  <!-- Define base age -->
  <subroutine name="age">
    <output>Base: 60</output>
  </subroutine>
  
  <!-- Call age - should show Base: 60 -->
  <call name="age" />
  
  <!-- Override age -->
  <subroutine name="age">
    <output>Override: 63</output>
  </subroutine>
  
  <!-- Call age again - should show Override: 63 -->
  <call name="age" />
</dirac>

<dirac>
  <!-- Original Zhi subroutine with nested age -->
  <subroutine name="Zhi">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <output>Name: Zhi, Age: </output>
    <call name="age" />
  </subroutine>
  
  <!-- Test: call original -->
  <output>First call: </output>
  <call name="Zhi" />
  <output>&#10;</output>
  
  <!-- Extended Zhi with updated age -->
  <subroutine name="Zhi" extends="Zhi">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
  </subroutine>
  
  <!-- Test: call extended -->
  <output>Second call: </output>
  <call name="Zhi" />
</dirac>

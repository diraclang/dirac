<dirac>
  <!-- Original Zhi subroutine -->
  <subroutine name="Zhi">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <output>Name: Zhi, Age: </output>
    <call name="age" />
  </subroutine>
  
  <!-- Extended Zhi subroutine with updated age -->
  <subroutine name="Zhi" extends="Zhi">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
  </subroutine>
  
  <call name="Zhi" />
</dirac>

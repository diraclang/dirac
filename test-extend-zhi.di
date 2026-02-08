<dirac>
  <subroutine name="Zhi">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <subroutine name="gender">
      <output>M</output>
    </subroutine>
    <output>Age: </output>
    <call name="age" />
    <output>, Gender: </output>
    <call name="gender" />
  </subroutine> 
  
  <!-- Extended Zhi with new age -->
  <subroutine name="Zhi" extends="Zhi">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
  </subroutine>
  
  <call name="Zhi" />
</dirac>

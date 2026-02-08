<dirac>
  <subroutine name="Zhi">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <subroutine name="gender">
      <output>M</output>
    </subroutine>
    <parameters select="*" />
  </subroutine> 
  
  <!-- Extended Zhi -->
  <subroutine name="Zhi" extends="Zhi">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
    <parameters select="*" />
  </subroutine>
  
  <Zhi><age /></Zhi>
  <output> | </output>
  <Zhi><gender /></Zhi>
</dirac>

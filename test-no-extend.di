<dirac>
  <!-- Just the extended Zhi without extends -->
  <subroutine name="Zhi">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
    <subroutine name="gender">
      <output>F</output>
    </subroutine>
    <parameters select="*" />
  </subroutine>
  
  <Zhi><age /></Zhi>
  <output> | </output>
  <Zhi><gender /></Zhi>
</dirac>

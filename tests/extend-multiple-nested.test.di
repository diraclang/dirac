<!-- TEST: extend_multiple_nested -->
<!-- EXPECT: 63 , M -->
<dirac>
  <subroutine name="base">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <subroutine name="gender">
      <output>M</output>
    </subroutine>
    <parameters select="*" />
  </subroutine>
  
  <subroutine name="base" extends="base">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
    <parameters select="*" />
  </subroutine>
  
  <base><age /></base>
  <output>,</output>
  <base><gender /></base>
</dirac>

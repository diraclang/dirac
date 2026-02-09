<dirac>
  <subroutine name="person">
    <subroutine name="age">
      <output>60</output>
    </subroutine>
    <output>Age: </output>
    <call name="age" />
  </subroutine>
  
  <subroutine name="person" extends="person">
    <subroutine name="age">
      <output>63</output>
    </subroutine>
  </subroutine>
  
  <call name="person" />
</dirac>

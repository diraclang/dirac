<!-- TEST: available-subroutines with foreach and attr -->
<!-- EXPECT: <subroutines>  <subroutine name="greet" description="Greets someone" />  <subroutine name="gender" description="Returns gender identity" />  <subroutine name="age" description="Returns the person age" /></subroutines> -->
<dirac>
<subroutine name="TestSuite">
  <subroutine name="age" description="Returns the person age">
    <output>42</output>
  </subroutine>
  
  <subroutine name="gender" description="Returns gender identity">
    <output>Male</output>
  </subroutine>
  
  <subroutine name="greet" description="Greets someone">
    <output>Hello!</output>
  </subroutine>

  <available-subroutines />
</subroutine>

<TestSuite />
</dirac>

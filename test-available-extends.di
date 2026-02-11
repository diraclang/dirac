<dirac>
  <subroutine name="Base">
    <subroutine name="method1" description="Base method 1">
      <output>Base 1</output>
    </subroutine>
    <subroutine name="method2" description="Base method 2">
      <output>Base 2</output>
    </subroutine>
    <output>In Base body, calling available-subroutines:</output>
    <output>
</output>
    <available-subroutines />
  </subroutine>
  
  <subroutine name="Base" extends="">
    <subroutine name="method1" description="Override method 1">
      <output>Override 1</output>
    </subroutine>
    <subroutine name="method3" description="New method 3">
      <output>New 3</output>
    </subroutine>
  </subroutine>
  
  <output>Calling Base:</output>
  <output>
</output>
  <Base />
</dirac>

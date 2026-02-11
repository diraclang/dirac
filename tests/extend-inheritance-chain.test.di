<!-- TEST: extend_inheritance_chain -->
<!-- EXPECT: A X C -->
<dirac>
  <subroutine name="data">
    <subroutine name="field1">
      <output>A</output>
    </subroutine>
    <subroutine name="field2">
      <output>B</output>
    </subroutine>
    <subroutine name="field3">
      <output>C</output>
    </subroutine>
    <call name="field1" />
    <call name="field2" />
    <call name="field3" />
  </subroutine>
  
  <subroutine name="data" extends="data">
    <subroutine name="field2">
      <output>X</output>
    </subroutine>
  </subroutine>
  
  <call name="data" />
</dirac>

<dirac>
  <test name="extend-basic">
    <description>Test basic extends with different parent name</description>
    <subroutine name="parent">
      <subroutine name="nested">
        <output>Parent nested</output>
      </subroutine>
      <output>In parent, calling: </output>
      <call name="nested" />
    </subroutine>
    
    <subroutine name="child" extends="parent">
      <subroutine name="nested">
        <output>Child nested</output>
      </subroutine>
    </subroutine>
    
    <call name="child" />
    <assert-output>In parent, calling: Child nested</assert-output>
  </test>

  <test name="extend-self">
    <description>Test self-extend (extend with same name)</description>
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
    <assert-output>Age: 63</assert-output>
  </test>

  <test name="extend-multiple-nested">
    <description>Test extends with multiple nested subroutines</description>
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
    <assert-output>63,M</assert-output>
  </test>

  <test name="extend-inheritance-chain">
    <description>Test that child inherits all parent nested subroutines</description>
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
    <assert-output>AXC</assert-output>
  </test>

  <test name="extend-with-parameters">
    <description>Test extends works with parameters</description>
    <subroutine name="greet" param-name="string:required">
      <output>Hello, </output>
      <output><variable name="name" /></output>
    </subroutine>
    
    <subroutine name="greet" extends="greet" param-name="string:required">
      <output>!</output>
    </subroutine>
    
    <greet name="World" />
    <assert-output>Hello, World!</assert-output>
  </test>
</dirac>

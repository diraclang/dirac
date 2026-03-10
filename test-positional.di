<dirac>
  <!-- Define a subroutine with parameters -->
  <subroutine name="greeting" param-name="string">
    <output>Hello, </output>
    <variable name="name"/>
    <output>!</output>
  </subroutine>
  
  <!-- Test 1: Named argument (should work as before) -->
  <output>Test 1: Named argument&#10;</output>
  <greeting name="Alice"/>
  <output>&#10;</output>
  
  <!-- Define a two-parameter subroutine -->
  <subroutine name="add" param-x="number" param-y="number">
    <variable name="x"/>
    <output> + </output>
    <variable name="y"/>
  </subroutine>
  
  <!-- Test 2: Two named parameters -->
  <output>Test 2: Two named parameters&#10;</output>
  <add x="5" y="10"/>
  <output>&#10;</output>
</dirac>

<!-- Subroutine and parameters test -->
<dirac>
  <subroutine name="greet">
    <parameters>
      <variable name="name" passby="value" />
    </parameters>
    <output>Hello, ${name}!</output>
  </subroutine>
  
  <call name="greet">
    <parameters>
      <variable value="Alice" />
    </parameters>
  </call>
  
  <output> </output>
  
  <call name="greet">
    <parameters>
      <variable value="Bob" />
    </parameters>
  </call>
</dirac>

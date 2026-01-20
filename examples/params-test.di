<dirac>
  <subroutine name="greet">
    <parameters select="@name"/>
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <greet name="Alice"/>
  <output>&#10;</output>
  <greet name="Bob"/>
</dirac>

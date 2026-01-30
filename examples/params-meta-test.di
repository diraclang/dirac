<dirac>
  <subroutine name="greet">
    <parameters select="@name"/>
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <subroutine name="greetmeta" param-name="string:required:name of the person" >
    <output>From Meta: Hello, <variable name="name" /></output>
  </subroutine>
  <greet name="Alice"/>
  <output>&#10;</output>
  <greet name="Bob"/>

  <output>&#10;</output>
  <greetmeta name="Zhi" />
  
</dirac>

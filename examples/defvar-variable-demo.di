<dirac>
  <!-- Simple example: defvar sets, variable gets -->
  <defvar name="greeting">Hello, World!</defvar>
  <output><variable name="greeting"/></output>
  <output>&#10;</output>
  
  <!-- Subroutine with parameter -->
  <subroutine name="greet">
    <parameters select="@name">
      <defvar name="localname"/>
    </parameters>
    <output>Greetings, <variable name="localname"/>!</output>
  </subroutine>
  
  <greet name="Alice"/>
  <output>&#10;</output>
  <greet name="Bob"/>
</dirac>

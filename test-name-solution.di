#!/usr/bin/env dirac
<dirac>
  <!-- Define a function that has a parameter called "name" -->
  <subroutine name="greet" param-name="String">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Solution: Use "subroutine" instead of "name" for the call -->
  <output>Using subroutine attribute: </output>
  <call subroutine="greet" name="Bob"/>
  <output>&#10;</output>
  
</dirac>

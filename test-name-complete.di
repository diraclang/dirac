#!/usr/bin/env dirac
<dirac>
  <!-- Define a function that has a parameter called "name" -->
  <subroutine name="greet" param-name="String">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Test 1: Using "subroutine" attribute (now works!) -->
  <output>Test 1 (using subroutine=): </output>
  <call subroutine="greet" name="Alice"/>
  <output>&#10;</output>
  
  <!-- Test 2: What if we still use "name" for function? -->
  <!-- This should call greet(), but what value does "name" parameter get? -->
  <output>Test 2 (using name= for function): </output>
  <call name="greet"/>
  <output>&#10;</output>
  
  <!-- Test 3: Function without param-name, using subroutine -->
  <subroutine name="hello" param-message="String">
    <output>Message: <variable name="message"/></output>
  </subroutine>
  
  <output>Test 3 (no name conflict): </output>
  <call name="hello" message="Hi there"/>
  <output>&#10;</output>
</dirac>

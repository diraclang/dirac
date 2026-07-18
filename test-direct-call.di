#!/usr/bin/env dirac
<dirac>
  <!-- Define functions -->
  <subroutine name="greet" param-name="String">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <subroutine name="welcome" param-user="String" param-location="String">
    <output>Welcome <variable name="user"/> to <variable name="location"/>!</output>
  </subroutine>
  
  <!-- Test direct call syntax (most common usage) -->
  <output>Test 1 - Direct call with param-name: </output>
  <greet name="Alice"/>
  <output>&#10;</output>
  
  <output>Test 2 - Direct call with multiple params: </output>
  <welcome user="Bob" location="NYC"/>
  <output>&#10;</output>
  
  <output>Test 3 - Direct call with param-name (different name): </output>
  <greet name="Charlie"/>
  <output>&#10;</output>
</dirac>

#!/usr/bin/env dirac
<dirac>
  <!-- Define a function that has a parameter called "name" -->
  <subroutine name="greet" param-name="String">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Test 1: Direct call syntax - works fine -->
  <output>Test 1 (direct syntax): </output>
  <greet name="Alice"/>
  <output>&#10;</output>
  
  <!-- Test 2: Using <call> syntax - CONFLICT! -->
  <!-- The "name" attribute is reserved for specifying the function name -->
  <!-- So we can't pass a "name" parameter to the function -->
  <output>Test 2 (call syntax with conflict): </output>
  <call name="greet" name="Bob"/>
  <!-- This is ambiguous! Which "name" is which? -->
  <output>&#10;</output>
  
</dirac>

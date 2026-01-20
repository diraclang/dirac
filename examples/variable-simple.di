<dirac>
  <!-- Test 1: Simple text variable -->
  <defvar name="name">Alice</defvar>
  <output>Hello, <variable name="name"/>!</output>
  <output>&#10;</output>
  
  <!-- Test 2: Using ${} substitution -->
  <output>Using substitution: Hello, ${name}!</output>
  <output>&#10;</output>
  
  <!-- Test 3: Number variable -->
  <defvar name="x">5</defvar>
  <defvar name="y">3</defvar>
  <output>x = <variable name="x"/>, y = <variable name="y"/></output>
  <output>&#10;</output>
</dirac>

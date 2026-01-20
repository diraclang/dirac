#!/usr/bin/env dirac
<dirac>
  <import src="./lib/math.di" />
  
  <output>Math Library Test&#10;&#10;</output>
  
  <defvar name="x" value="8" />
  <output>Square of ${x}: </output>
  <call name="SQUARE" />
  <output>&#10;</output>
  
  <defvar name="a" value="15" />
  <defvar name="b" value="25" />
  <output>${a} + ${b} = </output>
  <call name="ADD" />
  <output>&#10;</output>
  
  <defvar name="num" value="6" />
  <output>Factorial of ${num}: </output>
  <call name="FACTORIAL" />
  <output>&#10;</output>
</dirac>

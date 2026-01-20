#!/usr/bin/env dirac
<!-- Demo: Using imported libraries -->
<dirac>
  <output>Import Demo&#10;&#10;</output>
  
  <!-- Import libraries -->
  <import src="./lib/math.di" />
  <import src="./lib/fileops.di" />
  
  <output>Testing math library:&#10;</output>
  <defvar name="x" value="5" />
  <output>Square of ${x}: </output>
  <call name="SQUARE" />
  
  <defvar name="a" value="10" />
  <defvar name="b" value="20" />
  <output>Add ${a} + ${b}: </output>
  <call name="ADD" />
  
  <defvar name="num" value="5" />
  <output>Factorial of ${num}: </output>
  <call name="FACTORIAL" />
  
  <output>&#10;Testing file ops library:&#10;</output>
  <defvar name="dir" value="." />
  <call name="LIST_FILES" />
  <call name="COUNT_FILES" />
  
  <defvar name="filepath" value="./package.json" />
  <call name="FILE_EXISTS" />
</dirac>

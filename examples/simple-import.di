#!/usr/bin/env dirac
<!-- Simple import test -->
<dirac>
  <import src="./lib/math.di" />
  
  <defvar name="x" value="7" />
  <output>Testing SQUARE with x=${x}&#10;</output>
  
  <eval name="result">return 7 * 7;</eval>
  <output>Direct calc: ${result}&#10;</output>
  
  <call name="SQUARE" />
</dirac>

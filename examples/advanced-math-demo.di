#!/usr/bin/env dirac
<dirac>
  <!-- Import advanced math library -->
  <import src="./lib/advanced-math.di"/>

  <output>Advanced Math Library Demo&#10;&#10;</output>

  <!-- Square root -->
  <output>Square root of 16: </output>
  <MATH_SQRT n="16"/>
  <output>&#10;</output>

  <output>Square root of 2: </output>
  <MATH_SQRT n="2"/>
  <output>&#10;</output>

  <!-- Factorial -->
  <output>Factorial of 5: </output>
  <MATH_FACTORIAL n="5"/>
  <output>&#10;</output>

  <output>Factorial of 10: </output>
  <MATH_FACTORIAL n="10"/>
  <output>&#10;</output>

  <!-- GCD -->
  <output>GCD(48, 18): </output>
  <MATH_GCD a="48" b="18"/>
  <output>&#10;</output>

  <output>GCD(100, 35): </output>
  <MATH_GCD a="100" b="35"/>
  <output>&#10;</output>

  <!-- Prime check -->
  <output>Is 17 prime? </output>
  <MATH_PRIME n="17"/>
  <output>&#10;</output>

  <output>Is 20 prime? </output>
  <MATH_PRIME n="20"/>
  <output>&#10;</output>

  <!-- Random number -->
  <output>Random number [0-100]: </output>
  <MATH_RANDOM min="0" max="100"/>
  <output>&#10;</output>

  <!-- Statistics -->
  <output>&#10;Statistics for [1,2,3,4,5,10,100]:&#10;</output>
  <MATH_STATS data="[1,2,3,4,5,10,100]"/>
  <output>&#10;</output>
</dirac>

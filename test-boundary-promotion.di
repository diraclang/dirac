<dirac>
<defvar name="x" value="outer" />
<output>Level 0: x=$x</output>

<subroutine name="level1">
  <defvar name="y" value="middle" visible="true" />
  <output>Level 1: y=$y</output>
  
  <subroutine name="level2">
    <defvar name="z" value="inner" visible="true" />
    <output>Level 2: z=$z</output>
  </subroutine>
  
  <call name="level2" visible="variable" />
  <output>After level2 (in level1): z=$z</output>
</subroutine>

<call name="level1" visible="variable" />
<output>After level1 (at level0): y=$y, z=$z</output>
</dirac>

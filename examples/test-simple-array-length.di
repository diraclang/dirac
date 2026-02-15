<dirac>
  <output>Simple array length test...</output>
  
  <defvar name="myArray">["apple", "banana", "cherry"]</defvar>
  
  <array name="myArray"><length /></array>
  <assign name="myCount"><expr /></assign>
  
  <output>Count is: '<variable name="myCount" />'</output>
  <output>Type check: ${myCount}</output>
  
  <loop count="3">
    <output>Static loop: <variable name="i" /></output>
  </loop>
</dirac>

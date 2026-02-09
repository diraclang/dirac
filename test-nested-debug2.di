<dirac>
  <loop count="2" var="i">
    <loop count="2" var="j">
      <eval name="letter">return j === '0' ? 'A' : 'B';</eval>
      <output>[j=<variable name="j" /> letter=<variable name="letter" />] </output>
    </loop>
  </loop>
</dirac>

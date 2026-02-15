<!-- Math utility library -->
<dirac>
  <!-- Square a number -->
  <subroutine name="SQUARE" param-x="number">
    <eval name="result">return Number(x) * Number(x);</eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <!-- Add two numbers -->
  <subroutine name="ADD" param-a="number" param-b="number">
    <eval name="result">return Number(a) + Number(b);</eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <!-- Calculate factorial -->
  <subroutine name="FACTORIAL" param-num="number">
    <eval name="result">
      const n = parseInt(num, 10);
      let fact = 1;
      for (let i = 2; i &lt;= n; i++) fact *= i;
      return fact;
    </eval>
    <output><variable name="result" /></output>
  </subroutine>
</dirac>

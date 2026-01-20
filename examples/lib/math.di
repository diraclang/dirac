<!-- Math utility library -->
<dirac>
  <!-- Square a number -->
  <subroutine name="SQUARE">
    <eval name="result">return x * x;</eval>
    <output>${result}</output>
  </subroutine>
  
  <!-- Add two numbers -->
  <subroutine name="ADD">
    <eval name="result">return a + b;</eval>
    <output>${result}</output>
  </subroutine>
  
  <!-- Calculate factorial -->
  <subroutine name="FACTORIAL">
    <eval name="result">
      const n = parseInt(num);
      let fact = 1;
      for (let i = 2; i &lt;= n; i++) fact *= i;
      return fact;
    </eval>
    <output>${result}</output>
  </subroutine>
</dirac>

<dirac>
  <subroutine name="factorial" param-num="number">
    <eval name="result">
      const n = parseInt(num);
      if (n <= 1) {
        return 1;
      } else {
        let fact = 1;
        for (let i = 2; i <= n; i++) {
          fact *= i;
        }
        return fact;
      }
    </eval>
    <output><variable name="result" /></output>
  </subroutine>
  
  <call name="factorial" num="5" />
</dirac>

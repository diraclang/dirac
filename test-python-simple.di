<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Test 1: Simple Python computation (no dependencies) -->
  <python result="sum_result">
sum_result = sum(range(1, 11))
  </python>
  
  <output>Sum of 1-10: </output>
  <variable name="sum_result" />
  <output>
</output>

</dirac>

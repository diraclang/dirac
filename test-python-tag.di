<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Test 1: Simple Python computation -->
  <python result="sum_result">
sum_result = sum(range(1, 11))
  </python>
  
  <output>Sum of 1-10: </output>
  <variable name="sum_result" />
  <output>
</output>

  <!-- Test 2: Python with session variables -->
  <eval name="numbers">return [1, 2, 3, 4, 5]</eval>
  <output>Numbers variable: </output>
  <variable name="numbers" />
  <output>
</output>
  
  <python result="squared">
squared = [x**2 for x in numbers]
  </python>
  
  <output>Original: </output>
  <variable name="numbers" />
  <output>
</output>
  <output>Squared: </output>
  <variable name="squared" />
  <output>
</output>

  <!-- Test 3: Python data processing -->
  <python result="stats">
data = [10, 20, 30, 40, 50]
mean = sum(data) / len(data)
variance = sum((x - mean) ** 2 for x in data) / len(data)
stats = {"mean": mean, "variance": variance}
  </python>
  
  <output>Statistics: </output>
  <variable name="stats" />
  <output>
</output>

  <!-- Test 4: Using Python result in Dirac control flow -->
  <python result="is_valid">
import random
random.seed(42)
is_valid = random.random() > 0.5
  </python>
  
  <if test="is_valid">
    <output>Validation passed!</output>
  </if>
  <output>
</output>

  <!-- Test 5: Python without result (just execution) -->
  <python>
# This just runs, no result stored
print("Python says hello from Dirac!")
  </python>

</dirac>
  <python>
# This just runs, no result stored
print("Python says hello from Dirac!")
  </python>

</dirac>

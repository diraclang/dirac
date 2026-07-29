<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Test: Check if eval sets variables -->
  <eval name="test_num">return 42</eval>
  <output>Test number: </output>
  <variable name="test_num" />
  <output>
</output>

  <eval name="test_array">return [1, 2, 3]</eval>
  <output>Test array: </output>
  <variable name="test_array" />
  <output>
</output>

  <python result="result">
print(f"test_num exists: {'test_num' in globals()}")
print(f"test_array exists: {'test_array' in globals()}")
if 'test_array' in globals():
    result = test_array
else:
    result = "MISSING"
  </python>
  
  <output>Python result: </output>
  <variable name="result" />
  <output>
</output>

</dirac>

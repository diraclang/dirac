<!-- Test save-subroutine functionality -->
<dirac>
  <output>===== Testing Save Subroutine =====</output>
  <output></output>
  
  <!-- Define a test subroutine -->
  <subroutine name="test-greet" param-name="string">
    <output>Hello from test-greet, <variable name="name"/>!</output>
  </subroutine>
  
  <output>1. Created test-greet subroutine</output>
  <test-greet name="World" />
  <output></output>
  
  <!-- Test 1: Save with default location -->
  <output>2. Saving with default location (TIMESTAMP):</output>
  <save-subroutine name="test-greet" />
  <output></output>
  
  <!-- Test 2: Save to specific directory under ~/.dirac/lib/ -->
  <output>3. Saving to utils directory:</output>
  <save-subroutine name="test-greet" path="utils" />
  <output></output>
  
  <!-- Test 3: Save to explicit file path -->
  <output>4. Saving to explicit file:</output>
  <save-subroutine name="test-greet" file="./temp-test-greet.di" />
  <output></output>
  
  <output>===== Test Complete =====</output>
  <output>Check ~/.dirac/lib/ for saved files</output>
</dirac>

<dirac>
  <output>===== Attribute-based TEST-IF Tests =====</output>
  <output>
</output>
  
  <!-- Test 1: Simple true condition -->
  <output>Test 1: Simple true test</output>
  <defvar name="x" value="5"/>
  
  <test-if test="x">
    <output>x is truthy (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 2: Equality check -->
  <output>Test 2: Equality test</output>
  <defvar name="status" value="active"/>
  
  <test-if test="$status" eq="active">
    <output>Status is active (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 3: Not equal -->
  <output>Test 3: Not equal test</output>
  <defvar name="count" value="10"/>
  
  <test-if test="$count" ne="0">
    <output>Count is not zero (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 4: Greater than -->
  <output>Test 4: Greater than test</output>
  <defvar name="age" value="25"/>
  
  <test-if test="$age" gt="18">
    <output>Age is greater than 18 (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 5: Less than -->
  <output>Test 5: Less than test</output>
  <defvar name="temp" value="15"/>
  
  <test-if test="$temp" lt="20">
    <output>Temperature is less than 20 (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 6: Greater than or equal -->
  <output>Test 6: Greater than or equal test</output>
  <defvar name="score" value="100"/>
  
  <test-if test="$score" ge="100">
    <output>Score is 100 or higher (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 7: Less than or equal -->
  <output>Test 7: Less than or equal test</output>
  <defvar name="price" value="50"/>
  
  <test-if test="$price" le="50">
    <output>Price is 50 or less (correct!)</output>
  </test-if>
  <output>
</output>
  
  <!-- Test 8: False condition (should not output) -->
  <output>Test 8: False condition</output>
  <defvar name="flag" value="false"/>
  
  <test-if test="$flag" eq="true">
    <output>This should NOT appear</output>
  </test-if>
  <output>Test completed (no output expected above)</output>
  <output>
</output>
  
  <!-- Test 9: Variable existence check -->
  <output>Test 9: Variable exists</output>
  <defvar name="name" value="Alice"/>
  
  <test-if test="$name">
    <output>Name variable exists: <variable name="name"/></output>
  </test-if>
  <output>
</output>
  
  <!-- Test 10: Complex nested content -->
  <output>Test 10: Nested content in test-if</output>
  <defvar name="user_type" value="admin"/>
  
  <test-if test="$user_type" eq="admin">
    <output>Access granted for admin</output>
    <defvar name="permissions" value="full"/>
    <output>Permissions set to: <variable name="permissions"/></output>
  </test-if>
  <output>
</output>
  
  <output>===== All TEST-IF tests complete =====</output>
</dirac>

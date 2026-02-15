<dirac>
  <output>Testing execute + assign + array length...</output>
  
  <!-- Test 1: Direct JSON array -->
  <defvar name="test1">["a", "b", "c"]</defvar>
  <output>Test 1 length: <array name="test1"><length /></array></output>
  
  <!-- Test 2: Execute + assign -->
  <execute language="javascript">
    return JSON.stringify(["x", "y", "z"]);
  </execute>
  <assign name="test2"><expr /></assign>
  <output>Test 2 value: <variable name="test2" /></output>
  <output>Test 2 length: <array name="test2"><length /></array></output>
  
  <!-- Test 3: Use in loop count -->
  <array name="test2"><length /></array>
  <assign name="count2"><expr /></assign>
  <output>Count: <variable name="count2" /></output>
  
  <loop count="${count2}">
    <output>Loop iteration <variable name="i" /></output>
  </loop>
</dirac>

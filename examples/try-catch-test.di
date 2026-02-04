<dirac>
  <!-- Test 1: Basic throw and catch -->
  <output>Test 1: Basic throw and catch</output>
  <output>
</output>
  
  <try>
    <output>Inside try block</output>
    <throw name="myerror">
      <output>Error occurred: Something went wrong!</output>
    </throw>
    <output>This should not appear</output>
  </try>
  
  <catch name="myerror">
    <output>Caught exception: </output>
    <exception/>
  </catch>
  
  <output>
</output>
  <output>---</output>
  <output>
</output>

  <!-- Test 2: No matching catch -->
  <output>Test 2: Throw without matching catch</output>
  <output>
</output>
  
  <try>
    <output>Throwing specific error</output>
    <throw name="specificerror">
      <output>Specific error message</output>
    </throw>
  </try>
  
  <catch name="differenterror">
    <output>This should not appear</output>
  </catch>
  
  <output>
</output>
  <output>---</output>
  <output>
</output>

  <!-- Test 3: Multiple exceptions -->
  <output>Test 3: Multiple exceptions</output>
  <output>
</output>
  
  <try>
    <throw name="error1">
      <output>First error</output>
    </throw>
    <throw name="error2">
      <output>Second error</output>
    </throw>
    <throw name="error1">
      <output>Third error (error1 again)</output>
    </throw>
  </try>
  
  <catch name="error1">
    <output>Caught error1 exceptions: </output>
    <exception/>
  </catch>
  
  <output>
</output>
  <output>---</output>
  <output>
</output>

  <!-- Test 4: Nested try/catch -->
  <output>Test 4: Nested try/catch blocks</output>
  <output>
</output>
  
  <try>
    <output>Outer try</output>
    <try>
      <output>Inner try</output>
      <throw name="innerexception">
        <output>Inner exception message</output>
      </throw>
    </try>
    <catch name="innerexception">
      <output>Caught in inner catch: </output>
      <exception/>
    </catch>
    <output>After inner catch</output>
  </try>
  
  <output>
</output>
  <output>---</output>
  <output>
</output>

  <!-- Test 5: Default exception name -->
  <output>Test 5: Default exception name</output>
  <output>
</output>
  
  <try>
    <throw>
      <output>Default exception (no name attribute)</output>
    </throw>
  </try>
  
  <catch>
    <output>Caught default exception: </output>
    <exception/>
  </catch>

</dirac>

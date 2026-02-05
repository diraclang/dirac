<dirac>
  <output>===== Try/Catch/Throw Exception Handling Tests =====</output>
  <output>
</output>
  
  <!-- Test 1: Simple exception -->
  <output>Test 1: Simple exception throw and catch</output>
  <try>
    <throw name="error1">
      <output>Error message from throw</output>
    </throw>
  </try>
  
  <catch name="error1">
    <output>Caught: </output>
    <exception/>
  </catch>
  <output>
</output>
  
  <!-- Test 2: Named exceptions -->
  <output>Test 2: Multiple named exceptions</output>
  <try>
    <throw name="warning">
      <output>This is a warning</output>
    </throw>
    <throw name="error">
      <output>This is an error</output>
    </throw>
  </try>
  
  <catch name="warning">
    <output>Warnings: </output>
    <exception/>
  </catch>
  
  <catch name="error">
    <output>Errors: </output>
    <exception/>
  </catch>
  <output>
</output>
  
  <!-- Test 3: Exception with variable data -->
  <output>Test 3: Exception with variable data</output>
  <defvar name="errorCode" value="404"/>
  <defvar name="errorMsg" value="Not Found"/>
  
  <try>
    <throw name="httperror">
      <output>HTTP Error </output>
      <variable name="errorCode"/>
      <output>: </output>
      <variable name="errorMsg"/>
    </throw>
  </try>
  
  <catch name="httperror">
    <output>Caught HTTP error: </output>
    <exception/>
  </catch>
  <output>
</output>
  
  <!-- Test 4: No matching catch -->
  <output>Test 4: Exception with no matching catch (should not output)</output>
  <try>
    <throw name="uncaught">
      <output>This won't be caught</output>
    </throw>
  </try>
  
  <catch name="different">
    <output>This should NOT appear</output>
    <exception/>
  </catch>
  <output>Done with test 4</output>
  <output>
</output>
  
  <output>===== All tests complete =====</output>
</dirac>

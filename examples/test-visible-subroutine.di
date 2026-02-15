<!-- Test: visible="subroutine" attribute for PACKAGE_FINDING pattern -->

<!-- WITHOUT visible: nested subroutines get cleaned up after call -->
<subroutine name="PACKAGE_WITHOUT_VISIBLE">
  <output>Package without visible...</output>
  
  <subroutine name="HELPER_NO_VIS">
    <output>Helper (should be cleaned up)</output>
  </subroutine>
  
  <output>Package registered 1 subroutine</output>
</subroutine>

<!-- WITH visible="subroutine": nested subroutines persist after call -->
<subroutine name="PACKAGE_WITH_VISIBLE" visible="subroutine">
  <output>Package with visible="subroutine"...</output>
  
  <subroutine name="ARRAY_LENGTH" description="Get array length">
    <output>Array length: 42</output>
  </subroutine>
  
  <subroutine name="ARRAY_PUSH" description="Push to array">
    <output>Pushed to array</output>
  </subroutine>
  
  <output>Package registered 2 subroutines (visible)</output>
</subroutine>

<output>
=== Test 1: WITHOUT visible attribute ===
</output>
<PACKAGE_WITHOUT_VISIBLE />

<output>After call, available subroutines:</output>
<available-subroutines />

<output>

=== Test 2: WITH visible="subroutine" ===
</output>
<PACKAGE_WITH_VISIBLE />

<output>After call, available subroutines:</output>
<available-subroutines />

<output>
Now calling ARRAY_LENGTH (should work):
</output>
<ARRAY_LENGTH />

#!/usr/bin/env dirac
<dirac>
  <!-- Test call-time visible attribute -->
  
  <!-- Define asian with nested properties -->
  <subroutine name="asian">
    <subroutine name="hair"><output>black</output></subroutine>
    <subroutine name="eyes"><output>brown</output></subroutine>
    <output>Setting up Asian properties...</output>
  </subroutine>
  

  
  <!-- Test 2: With call-time visible="subroutine" - nested subroutines SHOULD persist -->
  <subroutine name="zhi">
    <asian visible="subroutine" />
    <output>Zhi defined (with visible=subroutine)</output>
    <parameters select="*" />
  </subroutine>
  
  <output>Test 2 - Call with visible="subroutine":</output>
  <output>&#10;</output>
  <zhi><hair /></zhi>

  <zhi><eyes /></zhi>

  
  <!-- Test 3: Override definition-time visible with call-time -->
  <subroutine name="european" visible="false">
    <subroutine name="skin"><output>pale</output></subroutine>
    <output>European properties (definition says visible=false)</output>
  </subroutine>
  
  <subroutine name="alice">
    <european visible="subroutine" />
    <output>Alice defined (call overrides with visible=subroutine)</output>
    <parameters select="*" />
  </subroutine>
  
  <output>Test 3 - Override definition-time visible:</output>
  <output>&#10;</output>
  <alice><skin /></alice>

  
  <output>&#10;All tests complete!</output>
</dirac>

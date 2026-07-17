<!-- Test: :remove command to remove subroutines from session stack -->
<dirac>
  <output>Test Remove Subroutine Command&#10;&#10;</output>
  
  <!-- Define some test subroutines -->
  <subroutine name="GREET">
    <output>Hello from GREET!&#10;</output>
  </subroutine>
  
  <subroutine name="FAREWELL">
    <output>Goodbye from FAREWELL!&#10;</output>
  </subroutine>
  
  <subroutine name="TEST_ROUTINE">
    <output>This is TEST_ROUTINE&#10;</output>
  </subroutine>
  
  <!-- List available subroutines -->
  <output>Available subroutines after definition:&#10;</output>
  <list-subroutines />
  <output>&#10;</output>
  
  <!-- Call one of them to verify it works -->
  <output>Calling GREET:&#10;</output>
  <GREET />
  <output>&#10;</output>
  
  <!-- Instructions for using :remove command -->
  <output>Now try these commands in the shell:&#10;</output>
  <output>  :remove GREET          # removes GREET from session&#10;</output>
  <output>  :subs                  # list remaining subroutines&#10;</output>
  <output>  :remove TEST_ROUTINE   # removes TEST_ROUTINE&#10;</output>
  <output>  :subs                  # only FAREWELL should remain&#10;</output>
  <output>&#10;</output>
  
  <output>Note: :remove only removes from session stack, not from disk&#10;</output>
</dirac>

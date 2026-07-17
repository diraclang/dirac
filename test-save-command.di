<dirac>
  <!-- Test :save command with proper whitespace handling -->
  
  <subroutine name="greet" param-name="string:required">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Save the subroutine -->
  <save-subroutine name="greet" file="/tmp/test-greet-save.di" />
</dirac>

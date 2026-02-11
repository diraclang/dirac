<dirac>
  <!-- Test library with two simple subroutines -->
  <subroutine name="first-sub"
              param-x="string"
              param-y="string">
    <output>First subroutine - x: <variable name="x" />, y: <variable name="y" /></output>
  </subroutine>

  <subroutine name="second-sub"
              param-x="string"
              param-y="string"
              param-z="string">
    <output>Second subroutine - x: <variable name="x" />, y: <variable name="y" />, z: <variable name="z" /></output>
  </subroutine>

  <!-- Main execution -->
  <output>============ Test: Sequential Subroutine Calls ============</output>
  <output></output>
  
  <!-- Define variables in main scope -->
  <defvar name="x" trim="true">value-x</defvar>
  <defvar name="y" trim="true">value-y</defvar>
  <defvar name="z" trim="true">value-z</defvar>
  
  <output>Variables defined in main scope:</output>
  <output>  x = <variable name="x" /></output>
  <output>  y = <variable name="y" /></output>
  <output>  z = <variable name="z" /></output>
  <output></output>
  
  <!-- Call first subroutine -->
  <output>Calling first-sub with x="$x" y="$y"</output>
  <first-sub x="$x" y="$y" />
  <output></output>
  
  <!-- Check if variables still exist after first call -->
  <output>After first-sub, checking main scope variables:</output>
  <output>  x = <variable name="x" /></output>
  <output>  y = <variable name="y" /></output>
  <output>  z = <variable name="z" /></output>
  <output></output>
  
  <!-- Call second subroutine -->
  <output>Calling second-sub with x="$x" y="$y" z="$z"</output>
  <second-sub x="$x" y="$y" z="$z" />
  <output></output>
  
  <output>After second-sub, checking main scope variables:</output>
  <output>  x = <variable name="x" /></output>
  <output>  y = <variable name="y" /></output>
  <output>  z = <variable name="z" /></output>
  <output></output>
  
  <output>============ Test Complete ============</output>
</dirac>

<!-- TEST: subroutine_sequential_calls_preserve_scope -->
<!-- EXPECT: x=a y=b z=c
first: x=a y=b
x=a y=b z=c
second: x=a y=b z=c
x=a y=b z=c -->
<dirac>
  <!-- Define subroutines -->
  <subroutine name="first-sub" param-x="string" param-y="string">
    <output>first: x=<variable name="x" /> y=<variable name="y" /></output>
  </subroutine>

  <subroutine name="second-sub" param-x="string" param-y="string" param-z="string">
    <output>second: x=<variable name="x" /> y=<variable name="y" /> z=<variable name="z" /></output>
  </subroutine>

  <!-- Define main scope variables -->
  <defvar name="x" trim="true">a</defvar>
  <defvar name="y" trim="true">b</defvar>
  <defvar name="z" trim="true">c</defvar>
  
  <!-- Verify initial state -->
  <output>x=<variable name="x" /> y=<variable name="y" /> z=<variable name="z" /></output>
  
  <!-- First call -->
  <first-sub x="$x" y="$y" />
  
  <!-- Verify variables still exist after first call -->
  <output>x=<variable name="x" /> y=<variable name="y" /> z=<variable name="z" /></output>
  
  <!-- Second call - this would fail with the bug -->
  <second-sub x="$x" y="$y" z="$z" />
  
  <!-- Verify variables still exist after second call -->
  <output>x=<variable name="x" /> y=<variable name="y" /> z=<variable name="z" /></output>
</dirac>

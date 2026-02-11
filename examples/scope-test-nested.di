<!-- Test nested subroutine calls with variable scope -->
<dirac>
  <output>
============ Test: Nested Subroutine Calls with Variable Scope ============
  </output>
  
  <!-- Define main scope variables -->
  <eval name="a">return "value-a"</eval>
  <eval name="b">return "value-b"</eval>
  <eval name="c">return "value-c"</eval>
  
  <output>
Main scope: a=<variable name="a" />, b=<variable name="b" />, c=<variable name="c" />
  </output>
  
  <!-- Subroutine that calls another subroutine -->
  <subroutine name="outer-sub" param-x="type:string:" param-y="type:string:">
    <output>  Outer subroutine - x: <variable name="x" />, y: <variable name="y" /></output>
    
    <!-- Define local variable in outer sub -->
    <eval name="outer_local">return "outer-value"</eval>
    <output>  Outer local: <variable name="outer_local" /></output>
    
    <!-- Call inner subroutine -->
    <call name="inner-sub" p="$x" q="$y"/>
    
    <!-- Check outer variables still exist after inner call -->
    <output>  After inner call - x: <variable name="x" />, y: <variable name="y" />, outer_local: <variable name="outer_local" /></output>
  </subroutine>
  
  <!-- Inner subroutine -->
  <subroutine name="inner-sub" param-p="type:string:" param-q="type:string:">
    <output>    Inner subroutine - p: <variable name="p" />, q: <variable name="q" /></output>
    <eval name="inner_local">return "inner-value"</eval>
    <output>    Inner local: <variable name="inner_local" /></output>
  </subroutine>
  
  <output>
Calling outer-sub with a and b...
  </output>
  <call name="outer-sub" x="$a" y="$b"/>
  
  <output>
After outer-sub, checking main scope:
  a=<variable name="a" />, b=<variable name="b" />, c=<variable name="c" />
  </output>
  
  <!-- Call outer-sub again to ensure no cumulative scope pollution -->
  <output>
Calling outer-sub AGAIN with b and c...
  </output>
  <call name="outer-sub" x="$b" y="$c"/>
  
  <output>
After second outer-sub call:
  a=<variable name="a" />, b=<variable name="b" />, c=<variable name="c" />

============ Test Complete ============
  </output>
</dirac>

<!-- TEST: subroutine_nested_calls_preserve_scope -->
<!-- EXPECT: main: a=x b=y c=z
outer: p=x q=y
inner: r=x s=y
outer after inner: p=x q=y
main after outer: a=x b=y c=z -->
<dirac>
  <!-- Inner subroutine -->
  <subroutine name="inner" param-r="string" param-s="string">
    <output>inner: r=<variable name="r" /> s=<variable name="s" /></output>
  </subroutine>

  <!-- Outer subroutine that calls inner -->
  <subroutine name="outer" param-p="string" param-q="string">
    <output>outer: p=<variable name="p" /> q=<variable name="q" /></output>
    <inner r="$p" s="$q" />
    <output>outer after inner: p=<variable name="p" /> q=<variable name="q" /></output>
  </subroutine>

  <!-- Define main scope variables -->
  <defvar name="a">x</defvar>
  <defvar name="b">y</defvar>
  <defvar name="c">z</defvar>
  
  <output>main: a=<variable name="a" /> b=<variable name="b" /> c=<variable name="c" /></output>
  
  <!-- Call outer which calls inner -->
  <outer p="$a" q="$b" />
  
  <!-- Verify main scope variables preserved -->
  <output>main after outer: a=<variable name="a" /> b=<variable name="b" /> c=<variable name="c" /></output>
</dirac>

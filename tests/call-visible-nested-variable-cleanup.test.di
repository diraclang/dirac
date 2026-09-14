<!-- TEST: call_visible_nested_variable_cleanup -->
<!-- EXPECT:
Inside b: instance=alpha
After b: instance=
-->
<dirac>
  <subroutine name="Object">
    <defvar name="instance" value="alpha" visible="true" />
  </subroutine>

  <subroutine name="b">
    <Object visible="both" />
    <output>Inside b: instance=<variable name="instance" /></output>
  </subroutine>

  <b />
  <output>After b: instance=<variable name="instance" /></output>
</dirac>

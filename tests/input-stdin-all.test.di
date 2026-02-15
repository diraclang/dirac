<!-- TEST: input_stdin_all -->
<!-- EXPECT: hello from stdin -->
<dirac>
  <defvar name="data">
    <input source="stdin" mode="all"/>
  </defvar>
  <output><variable name="data"/></output>
</dirac>

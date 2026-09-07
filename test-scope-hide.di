<dirac>
<subroutine name="test-hide">
  <defvar name="hide" value="abc" />
</subroutine>

<test-hide />

<output>Checking if hide variable exists...</output>
<variable name="hide" />
<output>
</output>
</dirac>

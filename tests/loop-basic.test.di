<!-- TEST: loop_basic -->
<!-- EXPECT: 0 1 2 -->
<dirac>
  <defvar name="i" value="0" />
  <loop count="3">
    <output><variable name="i" /></output>
    <assign name="i"><eval><variable name="i" /> + 1</eval></assign>
  </loop>
</dirac>

<!-- TEST: assign_basic -->
<!-- EXPECT: New value: updated -->
<dirac>
  <defvar name="myvar" value="initial" />
  <assign name="myvar" value="updated" />
  <output>New value: <variable name="myvar" /></output>
</dirac>

<!-- TEST: variable_interpolation -->
<!-- EXPECT: Hello, John! You are 25 years old. -->
<dirac>
  <defvar name="name" value="John" />
  <defvar name="age" value="25" />
  <output>Hello, <variable name="name" />! You are <variable name="age" /> years old.</output>
</dirac>

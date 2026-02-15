<!-- TEST: import_with_variable_substitution -->
<!-- EXPECT:
20
-->

<dirac>
  <subroutine name="TestSuite">
    <!-- Import with variable substitution -->
    <defvar name="libPath">./fixtures/test-lib.di</defvar>
    <import src="${libPath}" />
    
    <!-- Verify imported subroutine works -->
    <defvar name="result" trim="true"><DOUBLE x="10" /></defvar>
    <output><variable name="result" /></output>
  </subroutine>
  
  <TestSuite />
</dirac>

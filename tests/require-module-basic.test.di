<!-- TEST: require_module_basic -->
<!-- EXPECT: Platform: darwin -->
<dirac>
  <require_module name="os" var="os" />
  <eval name="platform">return os.platform();</eval>
  <output>Platform: <variable name="platform" /></output>
</dirac>

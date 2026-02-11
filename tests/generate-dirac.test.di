<!-- TEST: generate_and_execute_dirac -->
<!-- EXPECT: Generated file executed
Result: 42 -->
<dirac>
  <!-- Define a DIRAC script as literal -->
  <defvar name="generated_script" literal="true" trim="false">
<dirac>
  <defvar name="value">42</defvar>
  <output>Result: <variable name="value" /></output>
</dirac>
  </defvar>
  
  <!-- Write to file -->
  <output file="temp-generated.di"><variable name="generated_script" /></output>
  
  <!-- Execute the generated script -->
  <output>Generated file executed</output>
  <system shell="bash">
    node dist/cli.js temp-generated.di
    rm temp-generated.di
  </system>
</dirac>

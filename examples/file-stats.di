#!/usr/bin/env dirac
<!-- Executable Dirac Script: Quick File Analysis -->
<dirac>
  <eval name="fileCount">
    return fs.readdirSync('.').length;
  </eval>
  
  <eval name="diracFiles">
    return fs.readdirSync('.')
      .filter(f => f.endsWith('.di'))
      .length;
  </eval>
  
  <output>Current Directory Analysis&#10;</output>
  <output>========================&#10;</output>
  <output>Total files: ${fileCount}&#10;</output>
  <output>Dirac scripts: ${diracFiles}&#10;</output>
</dirac>

<!-- File operations library -->
<dirac>
  <!-- List files in directory -->
  <subroutine name="LIST_FILES">
    <eval name="files">
      return fs.readdirSync(dir || '.').join(', ');
    </eval>
    <output>Files: ${files}&#10;</output>
  </subroutine>
  
  <!-- Count files in directory -->
  <subroutine name="COUNT_FILES">
    <eval name="count">
      return fs.readdirSync(dir || '.').length;
    </eval>
    <output>Count: ${count}&#10;</output>
  </subroutine>
  
  <!-- Check if file exists -->
  <subroutine name="FILE_EXISTS">
    <eval name="exists">
      return fs.existsSync(filepath) ? 'yes' : 'no';
    </eval>
    <output>Exists: ${exists}&#10;</output>
  </subroutine>
</dirac>

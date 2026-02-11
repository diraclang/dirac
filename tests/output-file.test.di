<!-- TEST: output_file_basic -->
<!-- EXPECT: stdout output
File written -->
<dirac>
  <!-- Write to file -->
  <output file="output-test-temp.txt">File line 1</output>
  <output file="output-test-temp.txt">File line 2</output>
  
  <!-- Output to stdout to verify test runs -->
  <output>stdout output</output>
  
  <!-- Use system to verify file and clean up -->
  <system shell="bash">
    if [ -f output-test-temp.txt ]; then
      echo "File written"
      rm output-test-temp.txt
    fi
  </system>
</dirac>

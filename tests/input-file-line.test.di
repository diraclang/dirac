<!-- TEST: input_file_line -->
<!-- EXPECT: First: line one Second: line two Third: line three EOF: -->
<dirac>
  <output>First: </output>
  <input source="file" path="tests/test-input.txt" mode="line" />
  
  <output> Second: </output>
  <input source="file" path="tests/test-input.txt" mode="line" />
  
  <output> Third: </output>
  <input source="file" path="tests/test-input.txt" mode="line" />
  
  <output> EOF: </output>
  <input source="file" path="tests/test-input.txt" mode="line" />
</dirac>

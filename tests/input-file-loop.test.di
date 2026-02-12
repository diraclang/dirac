<!-- TEST: input_file_with_loop -->
<!-- EXPECT: line one | line two | line three | -->
<dirac>
  <loop count="3">
    <defvar name="line">
      <input source="file" path="tests/test-input.txt" mode="line" />
    </defvar>
    
    <variable name="line" />
    <output> | </output>
  </loop>
</dirac>

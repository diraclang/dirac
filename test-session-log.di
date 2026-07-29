<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <output>First output line</output>
  <output>
</output>
  <output>Second output line</output>
  <output>
</output>
  <output>Third output line</output>
  <output>
</output>
  
  <output>
</output>
  <output>========== Session Log Tests ==========</output>
  <output>
</output>
  <output>
</output>
  
  <!-- Test 1: Default format (text) -->
  <output>1. Default format (text):</output>
  <output>
</output>
  <session-log />
  <output>
</output>
  <output>
</output>
  
  <!-- Test 2: JSON format -->
  <output>2. JSON format:</output>
  <output>
</output>
  <session-log format="json" />
  <output>
</output>
  <output>
</output>
  
  <!-- Test 3: Array format (numbered list) -->
  <output>3. Array format (numbered):</output>
  <output>
</output>
  <session-log format="array" />
  <output>
</output>
  <output>
</output>
  
  <!-- Test 4: Count only -->
  <output>4. Count of output items: </output>
  <session-log format="count" />
  <output>
</output>
  <output>
</output>
  
  <!-- Test 5: Boundary-scoped output -->
  <output>5. Testing boundary-scoped output:</output>
  <output>
</output>
  <defvar name="captured">
    <output>  This is inside defvar</output>
    <output>
</output>
    <output>  Another line inside defvar</output>
    <output>
</output>
  </defvar>
  
  <output>Captured variable: </output>
  <variable name="captured" />
  <output>
</output>
  <output>
</output>
  
  <!-- Test 6: Show only current boundary scope -->
  <output>6. Output from current boundary only:</output>
  <output>
</output>
  <session-log format="text" boundary="true" />
  <output>
</output>

</dirac>

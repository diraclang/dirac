<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <output>Starting task-list</output>
  <output>
</output>

  <!-- Test 1: Basic defvar captures child output -->
  <defvar name="analysis_result">
    <output>Analyzing data...</output>
    <output>
</output>
    <output>Found 10 items</output>
    <output>
</output>
  </defvar>
  
  <output>Analysis stored in variable</output>
  <output>
</output>
  <output>Analysis result: </output>
  <variable name="analysis_result" />
  <output>
</output>

  <!-- Test 2: Nested defvar - grandchild hidden from parent -->
  <output>Starting complex task...</output>
  <output>
</output>
  
  <defvar name="task_summary">
    <output>Task level output</output>
    <output>
</output>
    
    <defvar name="internal_details">
      <output>Internal step 1</output>
      <output>
</output>
      <output>Internal step 2</output>
      <output>
</output>
    </defvar>
    
    <output>Task complete</output>
    <output>
</output>
  </defvar>
  
  <output>Task summary: </output>
  <variable name="task_summary" />
  <output>
</output>
  <output>Internal details: </output>
  <variable name="internal_details" />
  <output>
</output>

  <!-- Test 3: Sibling visibility -->
  <defvar name="step1">
    <output>Step 1 processing</output>
    <output>
</output>
  </defvar>
  
  <defvar name="step2">
    <output>Step 2 can see step1: </output>
    <variable name="step1" />
    <output>
</output>
  </defvar>
  
  <output>Final results:</output>
  <output>
</output>
  <output>Step 1: </output>
  <variable name="step1" />
  <output>
</output>
  <output>Step 2: </output>
  <variable name="step2" />
  <output>
</output>

</dirac>

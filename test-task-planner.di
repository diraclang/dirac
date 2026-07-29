<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Simulating a task planner with hierarchical subroutine calls -->
  
  <subroutine name="open-file">
    <output>  [Internal] Opening file handle...</output>
    <output>
</output>
    <output>  [Internal] Reading contents...</output>
    <output>
</output>
  </subroutine>
  
  <subroutine name="summarize-it">
    <output>  [Internal] Tokenizing text...</output>
    <output>
</output>
    <output>  [Internal] Computing summary...</output>
    <output>
</output>
  </subroutine>
  
  <subroutine name="analyse-log">
    <output>✓ Analyzed log file</output>
    <output>
</output>
    <output>✓ Found critical issues: 3</output>
    <output>
</output>
  </subroutine>
  
  <subroutine name="send-warning">
    <output>✓ Warning sent to admin</output>
    <output>
</output>
  </subroutine>
  
  <subroutine name="task-list">
    <output>=== Task Execution Report ===</output>
    <output>
</output>
    <output>
</output>
    
    <defvar name="analysis_output">
      <call name="analyse-log" />
    </defvar>
    
    <defvar name="warning_output">
      <call name="send-warning" />
    </defvar>
    
    <output>
</output>
    <output>=== Task Summary ===</output>
    <output>
</output>
    <variable name="analysis_output" />
    <variable name="warning_output" />
    <output>
</output>
    <output>=== All tasks completed ===</output>
    <output>
</output>
  </subroutine>
  
  <!-- Execute the task list -->
  <call name="task-list" />
  
</dirac>

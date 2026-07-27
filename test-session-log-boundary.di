<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Test boundary scoping -->
  
  <output>Global line 1</output>
  <output>
</output>
  <output>Global line 2</output>
  <output>
</output>
  
  <output>=== Full Buffer (count) ===</output>
  <output>
</output>
  <session-log format="count" />
  <output>
</output>
  <output>
</output>
  
  <defvar name="test">
    <output>Inside defvar line 1</output>
    <output>
</output>
    <output>Inside defvar line 2</output>
    <output>
</output>
    
    <output>Count inside boundary: </output>
    <session-log format="count" boundary="true" />
    <output>
</output>
    
    <output>Full buffer count: </output>
    <session-log format="count" />
    <output>
</output>
    
    <output>Boundary-scoped JSON:</output>
    <output>
</output>
    <session-log format="json" boundary="true" />
    <output>
</output>
  </defvar>
  
  <output>
</output>
  <output>Captured value: </output>
  <variable name="test" />
  <output>
</output>
  
</dirac>

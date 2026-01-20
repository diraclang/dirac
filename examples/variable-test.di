<dirac>
  <!-- Test 1: Simple text variable -->
  <defvar name="name">Alice</defvar>
  <output>Hello, <variable name="name"/>!</output>
  <output>&#10;</output>
  
  <!-- Test 2: Using ${} substitution -->
  <output>Using substitution: Hello, ${name}!</output>
  <output>&#10;</output>
  
  <!-- Test 3: Variable with XML code as string -->
  <defvar name="template">&lt;output&gt;Template says: Hello, &lt;variable name="name"/&gt;!&lt;/output&gt;</defvar>
  
  <output>Raw template: </output>
  <variable name="template"/>
  <output>&#10;</output>
  
  <!-- Test 4: Execute the template -->
  <output>Executed: </output>
  <execute source="template"/>
  <output>&#10;</output>
</dirac>

<?xml version="1.0" encoding="UTF-8"?>
<dirac debug="true">
  <!-- Test what boundary values actually are -->
  
  <echo>Step 1: Define a subroutine at top level</echo>
  <subroutine name="my-helper" description="A helper subroutine">
    <param name="msg"/>
    <echo>Helper says: $msg</echo>
  </subroutine>
  
  <echo>Step 2: Call LLM with show="all" (should see my-helper)</echo>
  <llm model="gpt-4" output="result1" show="all">
    List available subroutines
  </llm>
  <echo>Result with show=all: $result1</echo>
  
  <echo>Step 3: Call LLM with show="boundary" (should see my-helper?)</echo>
  <llm model="gpt-4" output="result2" show="boundary">
    List available subroutines
  </llm>
  <echo>Result with show=boundary: $result2</echo>
</dirac>

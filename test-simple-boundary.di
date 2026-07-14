<?xml version="1.0" encoding="UTF-8"?>
<dirac debug="true">
  <echo>========================================</echo>
  <echo>Test: Define subroutine then call LLM</echo>
  <echo>========================================</echo>
  
  <subroutine name="my-helper" description="A helper subroutine">
    <param name="msg"/>
    <echo>Helper says: $msg</echo>
  </subroutine>
  
  <echo>---</echo>
  <echo>Calling LLM with default (show="all"):</echo>
  <llm model="gpt-4" output="result_default" maxTokens="50">
    What subroutines can you see?
  </llm>
  <echo>LLM response: $result_default</echo>
  
  <echo>---</echo>
  <echo>Calling LLM with show="boundary":</echo>
  <llm model="gpt-4" output="result_boundary" show="boundary" maxTokens="50">
    What subroutines can you see?
  </llm>
  <echo>LLM response: $result_boundary</echo>
</dirac>

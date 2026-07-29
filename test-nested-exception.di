<!-- Test exception propagation through nested subroutines -->

<output>Test 1: Exception thrown in deeply nested subroutine</output>

<subroutine name="level-b">
  <output>Entering level-b</output>
  <throw name="b_level_exception" />
  <output>This should NOT print (after throw)</output>
</subroutine>

<subroutine name="level-a">
  <output>Entering level-a</output>
  <level-b />
  <output>This should NOT print (after level-b throw)</output>
</subroutine>

<try>
  <output>Starting try block</output>
  <level-a />
  <output>This should NOT print (after level-a throw)</output>
  
  <catch name="b_level_exception">
    <output>SUCCESS: Caught b_level_exception from nested subroutine!</output>
  </catch>
</try>

<output>After try-catch block</output>

<output>---</output>

<output>Test 2: Exception thrown in factory pattern</output>

<subroutine name="router-factory">
  <subroutine name="inner-router">
    <output>Inner router executing</output>
    <throw name="inner_exception" />
    <output>This should NOT print</output>
  </subroutine>
</subroutine>

<router-factory />

<try>
  <inner-router />
  
  <catch name="inner_exception">
    <output>SUCCESS: Caught inner_exception from factory subroutine!</output>
  </catch>
</try>

<output>All tests complete</output>

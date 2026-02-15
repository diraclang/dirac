<!-- Test break tag with condition -->
<output>Testing break with condition:</output>

<defvar name="items">["item1", "item2", "item3"]</defvar>

<loop count="10">
  <defvar name="i"><variable name="loop-index" /></defvar>
  
  <!-- Break if i >= 3 -->
  <test-if test="$i" ge="3">
    <output>Breaking at i=<variable name="i" /></output>
    <break />
  </test-if>
  
  <output>Loop iteration: <variable name="i" /></output>
</loop>

<output>After loop</output>

<!-- Test break with undefined check (simulating pop from array) -->
<output>
Testing break with undefined check:
</output>

<defvar name="count">0</defvar>
<loop count="10">
  <!-- Simulate getting item (would be from array pop in real scenario) -->
  <defvar name="loopidx"><variable name="loop-index" /></defvar>
  
  <!-- Break if loop-index > 2 (simulating empty array) -->
  <test-if test="$loopidx" gt="2">
    <output>No more items, breaking</output>
    <break />
  </test-if>
  
  <assign name="count"><expr>$count + 1</expr></assign>
  <output>Processing item <variable name="loopidx" /></output>
</loop>

<output>Processed <variable name="count" /> items</output>

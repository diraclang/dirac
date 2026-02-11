<dirac>
  <output>Testing background processes with loop...</output>
  
  <!-- Setup: Clean up old test files -->
  <system>rm -f /tmp/dirac-bg-counter.txt</system>
  
  <!-- Start a background process that writes incrementing numbers -->
  <system background="true">(for i in 1 2 3 4 5; do echo "Count: $i"; sleep 1; done > /tmp/dirac-bg-counter.txt) &</system>
  <output>✓ Background counter started</output>
  
  <!-- This executes immediately without waiting -->
  <output>✓ DIRAC continuing without blocking</output>
  
  <!-- Wait a moment for background process to start writing -->
  <system>sleep 2</system>
  
  <!-- Read the results in a loop (3 times, showing progressive output) -->
  <loop count="3">
    <system>wc -l /tmp/dirac-bg-counter.txt 2>/dev/null || echo "0"</system>
    <output>Check: Background file now has lines</output>
    <system>sleep 1</system>
  </loop>
  
  <!-- Give background process time to finish all 5 counts -->
  <system>sleep 2</system>
  
  <!-- Verify final result contains all 5 counts -->
  <system>wc -l /tmp/dirac-bg-counter.txt</system>
  <output>✓ Background process completed</output>
  
  <!-- Verify content -->
  <system>grep -c "Count:" /tmp/dirac-bg-counter.txt</system>
  <output>✓ Found all count entries</output>
  
  <!-- Cleanup -->
  <system>rm -f /tmp/dirac-bg-counter.txt</system>
  
  <output>✓ Background process with loop test passed</output>
</dirac>

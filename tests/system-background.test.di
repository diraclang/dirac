<dirac>
  <output>Testing background processes...</output>
  
  <!-- Test 1: Background process with output to file -->
  <system>rm -f /tmp/dirac-bg-test.txt</system>
  <system background="true">(sleep 2 && echo "Background task completed" > /tmp/dirac-bg-test.txt) &</system>
  <output>Background process started (will finish in 2 seconds)</output>
  
  <!-- This should execute immediately without waiting -->
  <output>Continuing without blocking...</output>
  
  <!-- Wait for background task to complete -->
  <system>sleep 3</system>
  
  <!-- Check if background task created the file -->
  <system>cat /tmp/dirac-bg-test.txt</system>
  <output>Background result: $SYSTEM_OUTPUT</output>
  
  <!-- Cleanup -->
  <system>rm -f /tmp/dirac-bg-test.txt</system>
  
  <output>✓ Background process test passed</output>
</dirac>

<dirac>
  <!-- Test schedule tag output -->
  
  <echo>Starting schedule test - should see messages every 3 seconds...</echo>
  <echo>Press Ctrl+C to stop</echo>
  <echo></echo>
  
  <schedule interval="3" name="test-output">
    <echo>=== Scheduled task executed at <system>date +%H:%M:%S</system> ===</echo>
    <set-variable name="counter" value="1"/>
    <echo>Counter value: <variable name="counter"/></echo>
  </schedule>
  
  <!-- Keep the process alive for testing -->
  <echo>Schedule task started. Waiting for executions...</echo>
</dirac>

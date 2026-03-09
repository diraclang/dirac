<!-- 
  Log monitoring with scheduled task
  This runs in the background and checks logs periodically
-->
<dirac>
  <defvar name="logFile" value="/tmp/test.log" />
  <defvar name="checkCount" value="0" />
  
  <!-- Create test log file if it doesn't exist -->
  <system>touch ${logFile}</system>
  
  <!-- Schedule monitoring task -->
  <schedule interval="5" name="log-monitor">
    <assign name="checkCount">
      <expr eval="plus">
        <arg><variable name="checkCount" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    
    <output>
[Check #<variable name="checkCount" />] Monitoring <variable name="logFile" />
    </output>
    
    <!-- Get file size -->
    <system output="fileSize" trim="true">wc -c &lt; ${logFile}</system>
    <output>  File size: <variable name="fileSize" /> bytes</output>
    
    <!-- Read last 5 lines -->
    <system output="lastLines" trim="true">tail -5 ${logFile}</system>
    <test-if test="$lastLines" ne="">
      <output>  Last lines:</output>
      <output><variable name="lastLines" /></output>
    </test-if>
  </schedule>
  
  <output>
=====================================
Log Monitor Started
=====================================
Monitoring: <variable name="logFile" />
Check interval: 5 seconds

Commands:
  :tasks          - List scheduled tasks
  :stop log-monitor - Stop the monitor
  :stopall        - Stop all tasks

To test, open another terminal and run:
  echo "Test log entry" &gt;&gt; /tmp/test.log

Press Ctrl+D or type :exit to quit
=====================================
  </output>
</dirac>
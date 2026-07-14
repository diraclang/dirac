<!-- 
  Run-At Examples - One-time delayed execution
  
  The <run-at> tag schedules a task to run once at a future time.
  After execution, it automatically removes itself.
-->
<dirac>
  <defvar name="counter" value="0" />
  
  <!-- Run in 10 seconds -->
  <run-at time="+10" name="quick-reminder">
    <system output="now" trim="true">date "+%H:%M:%S"</system>
    <output>⏰ [<variable name="now" />] Quick reminder executed after 10 seconds!
</output>
  </run-at>
  
  <!-- Run in 30 seconds -->
  <run-at time="+30" name="half-minute">
    <assign name="counter">
      <expr eval="plus">
        <arg><variable name="counter" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <system output="time" trim="true">date "+%H:%M:%S"</system>
    <output>📢 [<variable name="time" />] 30 second timer! Counter: <variable name="counter" />
</output>
  </run-at>
  
  <!-- Run in 1 minute -->
  <run-at time="+1m" name="one-minute">
    <assign name="counter">
      <expr eval="plus">
        <arg><variable name="counter" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <system output="timestamp" trim="true">date "+%H:%M:%S"</system>
    <output>⏲️  [<variable name="timestamp" />] One minute has passed! Counter: <variable name="counter" />
</output>
  </run-at>
  
  <system output="currentTime" trim="true">date "+%H:%M:%S"</system>
  <output>
=====================================
Scheduled Runs Started
=====================================
Current time: <variable name="currentTime" />

Scheduled:
  1. quick-reminder - in 10 seconds
  2. half-minute    - in 30 seconds
  3. one-minute     - in 1 minute

Commands:
  :scheduled         - List all scheduled runs
  :cancel <name>     - Cancel a specific run
  :cancelall         - Cancel all runs

Time formats supported by <run-at>:
  "+10"              - 10 seconds from now
  "+5m"              - 5 minutes from now
  "+2h"              - 2 hours from now
  "2026-04-07T15:30:00" - Specific date/time (ISO)
  "1712502600000"    - Unix timestamp in milliseconds

Wait and watch them execute...
</output>
</dirac>

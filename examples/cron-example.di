<!-- 
  Cron Job Examples
  
  The <cron> tag uses standard cron syntax for scheduling:
  Format: minute hour day month weekday
  
  Examples of cron expressions:
  - "* * * * *"      Every minute
  - "*/5 * * * *"    Every 5 minutes
  - "0 * * * *"      Every hour at minute 0
  - "0 9 * * *"      Every day at 9 AM
  - "0 9 * * 1-5"    Weekdays at 9 AM
  - "0 0 * * 0"      Sundays at midnight
  - "30 8-17 * * 1-5" Every hour from 8:30 AM to 5:30 PM, Monday-Friday
-->
<dirac>
  <defvar name="checkCount" value="0" />
  <defvar name="lastCheck" value="never" />
  
  <!-- Run every minute to demonstrate -->
  <cron time="* * * * *" name="health-check">
    <assign name="checkCount">
      <expr eval="plus">
        <arg><variable name="checkCount" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    
    <!-- Get current time -->
    <system output="currentTime" trim="true">date "+%H:%M:%S"</system>
    <assign name="lastCheck" value="$currentTime" />
    
    <output>
[Health Check #<variable name="checkCount" />] Time: <variable name="lastCheck" />
    </output>
    
    <!-- Simulate checking something -->
    <system output="memUsage" trim="true">ps aux | head -1; ps aux | grep -i dirac | head -1</system>
    <output>Memory check complete</output>
  </cron>
  
  <output>
=====================================
Cron Job Started
=====================================
Job: health-check
Schedule: Every minute (for demo)
  
Commands:
  :crons           - List all cron jobs
  :stopcron health-check - Stop this job
  :stopallcrons    - Stop all jobs

The job will run every minute.
In production, you might use:
  - "0 9 * * *"    for daily at 9 AM
  - "*/5 * * * *"  for every 5 minutes
  - "0 * * * *"    for every hour
  
</output>
</dirac>

<!--
  Multiple Cron Jobs Example
  
  This shows how to run multiple cron jobs with different schedules.
  Useful for agent scenarios like reminders, monitoring, etc.
-->
<dirac>
  <defvar name="hourlyCount" value="0" />
  <defvar name="quickCount" value="0" />
  
  <!-- Quick check every minute (for demo) -->
  <cron time="* * * * *" name="quick-check">
    <assign name="quickCount">
      <expr eval="plus">
        <arg><variable name="quickCount" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <system output="now" trim="true">date "+%H:%M:%S"</system>
    <output>⚡ Quick check #<variable name="quickCount" /> at <variable name="now" />
</output>
  </cron>
  
  <!-- Would run hourly in production, but for demo runs at specific minute -->
  <!-- Change "5 * * * *" to match current minute + 1 for testing -->
  <cron time="*/2 * * * *" name="hourly-summary">
    <assign name="hourlyCount">
      <expr eval="plus">
        <arg><variable name="hourlyCount" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <system output="timestamp" trim="true">date "+%Y-%m-%d %H:%M:%S"</system>
    <output>
📊 Hourly Summary #<variable name="hourlyCount" />
   Time: <variable name="timestamp" />
   Quick checks so far: <variable name="quickCount" />
</output>
  </cron>
  
  <!-- Daily reminder would be "0 9 * * *" for 9 AM -->
  <!-- For demo, set to current minute + 3 -->
  <cron time="*/3 * * * *" name="reminder">
    <system output="date" trim="true">date "+%A, %B %d"</system>
    <output>
📅 Daily Reminder
   Date: <variable name="date" />
   Don't forget to check your tasks!
</output>
  </cron>
  
  <output>
=====================================
Multiple Cron Jobs Started
=====================================
Jobs running:
  1. quick-check    - Every minute
  2. hourly-summary - Every 2 minutes (demo)
  3. reminder       - Every 3 minutes (demo)

Commands:
  :crons                 - List all jobs
  :stopcron <name>       - Stop specific job
  :stopallcrons          - Stop all jobs

Example production schedules:
  "* * * * *"      - Every minute (health checks)
  "*/5 * * * *"    - Every 5 minutes (quick monitoring)
  "0 * * * *"      - Every hour (summaries)
  "0 9 * * *"      - Daily at 9 AM (reminders)
  "0 9 * * 1"      - Mondays at 9 AM (weekly reports)
  "0 0 1 * *"      - First of month (monthly tasks)
  
Wait a few minutes to see the jobs execute...
</output>
</dirac>

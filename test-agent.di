<dirac>
  <!-- Test agent with a cron job -->
  <print>Starting cron job that runs every minute...</print>
  
  <cron schedule="* * * * *">
    <print>Cron executed at: </print>
    <call-system command="date" />
  </cron>
  
  <print>Cron job started. It will run every minute.</print>
  <print>Check logs with: dirac agent logs -f</print>
</dirac>

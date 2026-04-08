<!--
  Telegram Cron Job Test
  
  Setup:
  1. Set environment variables:
     export TELEGRAM_BOT_TOKEN="your-bot-token-here"
     export TELEGRAM_CHAT_ID="your-chat-id-here"
  
  2. Run in shell: dirac shell examples/telegram-cron-test.di
  
  3. Commands available:
     :crons              - List all cron jobs
     :stopcron 1         - Stop cron job by ID
     :stopallcrons       - Stop all cron jobs
-->
<dirac>
  <!-- Import telegram library -->
  <import src="../dirac-stdlib/lib/telegram.di" />
  
  <output>
========================================
Telegram Cron Job Test
========================================
Setting up scheduled greetings...
</output>

  <!-- Send immediate test message -->
  <output>
📱 Sending immediate test message...
</output>
  
  <send-telegram-message message="🤖 Dirac Shell Test: Hello from Dirac! This is an immediate message." />
  
  <output>

⏰ Setting up cron jobs:
</output>

  <!-- Send a greeting every minute (for testing) -->
  <cron time="*/1 * * * *" name="minute-greeting">
    <output>⏱️  [Minute Cron] Sending greeting...</output>
    <send-telegram-message message="🤖 Dirac Minute Greeting: It's been another minute! ⏰" />
  </cron>
  
  <output>✅ Cron job 1: Minute greeting (every minute)</output>
  
  <!-- Send a greeting every 5 minutes -->
  <cron time="*/5 * * * *" name="five-minute-greeting">
    <output>⏱️  [5-Min Cron] Sending 5-minute greeting...</output>
    <eval name="current_time">
      return new Date().toLocaleTimeString();
    </eval>
    <send-telegram-message message="🤖 Dirac 5-Minute Update: The time is ${current_time}! 🕐" />
  </cron>
  
  <output>✅ Cron job 2: 5-minute greeting (every 5 minutes)</output>
  
  <!-- Send a morning greeting at 9 AM every day -->
  <cron time="0 9 * * *" name="morning-greeting">
    <output>🌅 [Morning Cron] Sending morning greeting...</output>
    <send-telegram-message message="🌅 Good morning! Have a great day! ☀️" />
  </cron>
  
  <output>✅ Cron job 3: Morning greeting (9:00 AM daily)</output>

  <output>

========================================
Cron jobs are now running!

Use these commands:
  :crons           - List all running cron jobs
  :stopcron N      - Stop cron job N
  :stopallcrons    - Stop all cron jobs

The shell will stay open. Press Ctrl+C to exit.
========================================
</output>
</dirac>

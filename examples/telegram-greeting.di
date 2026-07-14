<!--
  Simple Telegram Greeting Subroutine
  
  Load this in shell with: |import src="examples/telegram-greeting.di">
  Then use: <send-greeting message="Your message here" />
  
  Or with cron: <cron time="*/2 * * * *" name="greeting">
                  <send-greeting message="Hello every 2 minutes!" />
                </cron>
-->
<dirac>
  <import src="../dirac-stdlib/lib/telegram.di" />
  
  <!-- Simple greeting subroutine -->
  <subroutine name="send-greeting"
              description="Send a greeting message to Telegram"
              param-message="string:required:The greeting message to send">
    
    <eval name="timestamp">
      return new Date().toLocaleString();
    </eval>
    
    <defvar name="full_message">🤖 Dirac Greeting at ${timestamp}:

${message}</defvar>
    
    <send-telegram-message message="$full_message" />
    
    <output>✅ Sent greeting: ${message}</output>
  </subroutine>
  
  <output>✅ Loaded telegram greeting subroutine. Use: |send-greeting message="Hello!"></output>
</dirac>

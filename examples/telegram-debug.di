<!--
  Debug Telegram API - Show raw response
-->
<dirac>
  <defvar name="bot_token" trim="true"><environment name="TELEGRAM_BOT_TOKEN" /></defvar>
  
  <test-if test="$bot_token" eq="">
    <output>❌ TELEGRAM_BOT_TOKEN not set!</output>
    <throw message="TELEGRAM_BOT_TOKEN required" />
  </test-if>
  
  <output>
🔍 Fetching updates from Telegram API...
================================
</output>

  <defvar name="api_url">https://api.telegram.org/bot<variable name="bot_token" />/getUpdates</defvar>
  
  <output>API URL: <variable name="api_url" /></output>
  <output>
</output>

  <!-- Get updates -->
  <defvar name="response" trim="true"><system>curl -s "<variable name="api_url" />"</system></defvar>
  
  <output>Raw API Response:
================================
<variable name="response" />
================================
</output>

  <!-- Pretty print if jq is available -->
  <output>
Attempting to pretty-print with jq (if available):
================================
</output>
  
  <system>echo '<variable name="response" />' | jq . 2>/dev/null || echo "jq not installed, showing raw JSON above"</system>

</dirac>

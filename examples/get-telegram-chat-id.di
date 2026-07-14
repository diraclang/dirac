<!--
  Get Your Telegram Chat ID
  
  Instructions:
  1. Make sure TELEGRAM_BOT_TOKEN is set in your environment
  2. Send ANY message to your bot on Telegram (open the bot and type something)
  3. Run this script: dirac examples/get-telegram-chat-id.di
  4. Your chat ID will be displayed
  5. Set it: export TELEGRAM_CHAT_ID="your-chat-id"
-->
<dirac>
  <import src="dirac-json/lib/index.di" />
  
  <!-- Get bot token -->
  <defvar name="bot_token" trim="true"><environment name="TELEGRAM_BOT_TOKEN" /></defvar>
  
  <test-if test="$bot_token" eq="">
    <output>❌ Error: TELEGRAM_BOT_TOKEN not set!

Please set it first:
  export TELEGRAM_BOT_TOKEN="your-bot-token-here"
</output>
    <throw message="TELEGRAM_BOT_TOKEN not set" />
  </test-if>
  
  <output>
🔍 Fetching your Telegram Chat ID...
================================

Make sure you've sent at least one message to your bot!
(Open Telegram, find your bot, and send any message)

Checking for updates...
</output>

  <!-- Build API URL to get updates -->
  <defvar name="api_url">https://api.telegram.org/bot<variable name="bot_token" />/getUpdates</defvar>
  
  <!-- Get updates -->
  <defvar name="updates" trim="true"><system>curl -s "<variable name="api_url" />"</system></defvar>
  
  <!-- Check if we got any results -->
  <if>
    <expr eval="contains">
      <arg><variable name="updates" /></arg>
      <arg>"result"</arg>
    </expr>
    <then>
      <!-- Try to extract chat_id from first message -->
      <defvar name="chat_id" trim="true">
        <json name="updates">
          <get jsonPath="result[0].message.chat.id" />
        </json>
      </defvar>
      
      <defvar name="sender_name" trim="true">
        <json name="updates">
          <get jsonPath="result[0].message.from.first_name" />
        </json>
      </defvar>
      
      <defvar name="message_text" trim="true">
        <json name="updates">
          <get jsonPath="result[0].message.text" />
        </json>
      </defvar>
      
      <test-if test="$chat_id" ne="">
        <output>
✅ Found your chat information!
================================

Your Chat ID: <variable name="chat_id" />
Sender Name: <variable name="sender_name" />
Last Message: <variable name="message_text" />

To use this chat ID, run:
  export TELEGRAM_CHAT_ID="<variable name="chat_id" />"

Or add it to your ~/.bashrc or ~/.zshrc:
  echo 'export TELEGRAM_CHAT_ID="<variable name="chat_id" />"' >> ~/.zshrc
================================
</output>
      </test-if>
      
      <test-if test="$chat_id" eq="">
        <output>
⚠️  No messages found!
================================

Please:
1. Open Telegram
2. Find your bot (search for its username)
3. Send ANY message to the bot (e.g., "hello")
4. Run this script again

Bot Token Status: ✓ Valid
================================
</output>
      </test-if>
    </then>
    <else>
      <output>
❌ Error fetching updates!
================================

Response from Telegram:
<variable name="updates" />

Make sure:
1. Your bot token is correct
2. You've sent a message to your bot
================================
</output>
    </else>
  </if>
</dirac>

<!-- 
  Log monitoring service example
  This demonstrates using condition-based loops for container deployments
  
  Usage:
    dirac examples/monitor-logs.di
  
  Container usage:
    docker run -v /var/log:/logs myapp dirac /app/monitor-logs.di
-->
<dirac>
  <!-- Configuration -->
  <defvar name="logFile" value="/var/log/app.log" />
  <defvar name="checkInterval" value="3600" />
  <defvar name="running" value="true" />
  <defvar name="lastSize" value="0" />
  
  <!-- Main monitoring loop -->
  <loop condition="${running}">
    <output>
[Monitor] Checking logs at <system>date</system>
    </output>
    
    <!-- Get current log file size -->
    <system output="currentSize">wc -c &lt; ${logFile}</system>
    
    <!-- Check if log has grown -->
    <if condition="${currentSize} != ${lastSize}">
      <output>
[Monitor] Log file changed: ${lastSize} -> ${currentSize} bytes
      </output>
      
      <!-- Read new log entries (tail) -->
      <input name="newLogs" src="${logFile}" mode="tail" lines="100" />
      
      <!-- Analyze with LLM (if configured) -->
      <if condition="${LLM_ENABLED} == true">
        <llm output="analysis">
You are a log analyzer. Review these recent log entries and identify:
1. Critical errors or warnings
2. Performance issues
3. Security concerns
4. Unusual patterns

Log entries:
${newLogs}

Provide a brief summary and alert level (LOW/MEDIUM/HIGH/CRITICAL).
        </llm>
        
        <output>
[Analysis]
${analysis}
        </output>
        
        <!-- Send alert if critical -->
        <if condition="${analysis} contains CRITICAL">
          <system>
curl -X POST https://alerts.example.com/notify \
  -H "Content-Type: application/json" \
  -d '{"level": "CRITICAL", "message": "${analysis}", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
          </system>
          <output>[Alert] Critical issue notification sent</output>
        </if>
      </if>
      
      <!-- Update last known size -->
      <assign name="lastSize" value="${currentSize}" />
    </if>
    
    <!-- Sleep until next check -->
    <output>[Monitor] Sleeping for ${checkInterval} seconds...</output>
    <system>sleep ${checkInterval}</system>
  </loop>
  
  <output>
[Monitor] Service stopped
  </output>
</dirac>
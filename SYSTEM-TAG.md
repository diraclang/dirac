# System Tag - Platform Behavior

The `<system>` tag executes shell commands on the host operating system. Behavior varies by platform.

## Platform Differences

### macOS / Linux

**Shell:** `/bin/sh` (POSIX shell)

**Common commands:**
```xml
<system>ls -la /var/log</system>
<system>tail -100 /var/log/app.log</system>
<system>df -h</system>
<system>curl https://api.example.com</system>
<system>grep ERROR /var/log/app.log</system>
<system>open https://youtube.com</system>  <!-- macOS -->
<system>xdg-open https://youtube.com</system>  <!-- Linux -->
```

### Windows

**Shell:** `cmd.exe` (or PowerShell if configured)

**Equivalent commands:**
```xml
<system>dir C:\logs</system>
<system>Get-Content -Tail 100 C:\logs\app.log</system>  <!-- PowerShell -->
<system>type C:\logs\app.log</system>  <!-- cmd.exe -->
<system>curl https://api.example.com</system>  <!-- Works on Win 10+ -->
<system>findstr ERROR C:\logs\app.log</system>
<system>start https://youtube.com</system>
```

## Cross-Platform Scripts

### Option 1: Platform Detection

```xml
<eval name="platform">
  return process.platform; // 'darwin', 'linux', 'win32'
</eval>

<!-- Conditional execution -->
<test-if test="$platform" eq="win32">
  <system>dir C:\logs</system>
</test-if>

<test-if test="$platform" ne="win32">
  <system>ls /var/log</system>
</test-if>
```

### Option 2: Use Node.js Native Features

For common operations, use built-in tags instead of shell commands:

```xml
<!-- Instead of platform-specific shell commands -->
<eval name="files">
  const fs = require('fs');
  return fs.readdirSync('/var/log').join('\n');
</eval>

<eval name="content">
  const fs = require('fs');
  const lines = fs.readFileSync('app.log', 'utf-8').split('\n');
  return lines.slice(-100).join('\n'); // Last 100 lines
</eval>
```

### Option 3: Cross-Platform Subroutines

Use the `dirac-stdlib` cross-platform helpers:

```xml
<import src="dirac-stdlib/lib/cross-platform.di" />

<!-- These work on all platforms -->
<open-url url="https://youtube.com" />
<list-files path="logs" output="files" />
<read-file-tail path="app.log" lines="100" output="content" />
```

## Background Execution

Run commands in the background (don't wait for completion):

```xml
<system background="true">
  node server.js &gt; server.log 2&gt;&amp;1
</system>

<output>Server started in background</output>
```

**Note:** Background processes are detached and will continue running even if Dirac exits.

## Output Capture

Capture command output to a variable:

```xml
<system output="result">
  curl -s https://api.example.com/status
</system>

<output>API returned: <variable name="result" /></output>
```

## Common Platform-Specific Commands

| Task | macOS/Linux | Windows |
|------|-------------|---------|
| List files | `ls -la` | `dir` |
| View file | `cat file.txt` | `type file.txt` |
| Tail logs | `tail -f app.log` | `Get-Content -Tail 10 -Wait app.log` |
| Search text | `grep pattern file` | `findstr pattern file` |
| Disk usage | `df -h` | `wmic logicaldisk get size,freespace` |
| Process list | `ps aux` | `tasklist` |
| Open URL | `open url` (Mac)<br>`xdg-open url` (Linux) | `start url` |
| Kill process | `kill PID` | `taskkill /PID PID` |
| Network | `netstat -an` | `netstat -an` (same!) |
| HTTP request | `curl url` | `curl url` (Win 10+) |

## Error Handling

System command failures throw errors:

```xml
<try>
  <system>some-nonexistent-command</system>
  
  <catch name="error">
    <output>Command failed: <exception /></output>
  </catch>
</try>
```

## Security Considerations

⚠️ **Warning:** The `<system>` tag executes arbitrary shell commands. Be careful with:

1. **User input:** Never pass unsanitized user input to `<system>`
2. **Command injection:** Validate and escape variables
3. **File paths:** Use absolute paths to avoid ambiguity
4. **Permissions:** Commands run with Dirac's user permissions

**Example vulnerability:**
```xml
<!-- DANGEROUS - vulnerable to injection -->
<defvar name="user_input" value="file.txt; rm -rf /" />
<system>cat <variable name="user_input" /></system>

<!-- SAFER - validate input first -->
<test-if test="$user_input" contains=";">
  <throw message="Invalid filename" />
</test-if>
<system>cat <variable name="user_input" /></system>
```

## Best Practices

1. **Use cross-platform alternatives** when available (Node.js APIs, stdlib helpers)
2. **Test on target platforms** before deploying
3. **Document platform requirements** in your scripts
4. **Handle errors gracefully** with try/catch
5. **Use absolute paths** to avoid ambiguity
6. **Set timeouts** for long-running commands (future feature)
7. **Validate input** to prevent injection attacks

## Environment Variables

Commands inherit Dirac's environment:

```xml
<system>echo $PATH</system>  <!-- Unix -->
<system>echo %PATH%</system>  <!-- Windows -->

<!-- Set custom environment -->
<system>export MY_VAR=value; my-command</system>  <!-- Unix -->
<system>set MY_VAR=value &amp;&amp; my-command</system>  <!-- Windows -->
```

## Examples

### Cross-Platform Health Check

```xml
<subroutine name="check-api-health">
  <system output="status">
    curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health
  </system>
  
  <test-if test="$status" eq="200">
    <output>✅ API is healthy</output>
  </test-if>
  
  <test-if test="$status" ne="200">
    <output>❌ API returned: <variable name="status" /></output>
  </test-if>
</subroutine>
```

### Platform-Aware File Listing

```xml
<eval name="is_windows">
  return process.platform === 'win32';
</eval>

<test-if test="$is_windows" eq="true">
  <system output="files">dir /b C:\logs</system>
</test-if>

<test-if test="$is_windows" eq="false">
  <system output="files">ls /var/log</system>
</test-if>

<output>Files: <variable name="files" /></output>
```

## Future Enhancements

Planned features:
- Timeout support
- Streaming output for long-running commands
- Better error context (exit codes, signals)
- Built-in command translation (auto-detect platform)
- Sandboxed execution mode

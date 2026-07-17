# Schedule and Cron Investigation Report

## Summary

I've investigated both scheduling systems in Dirac:

### 1. **Cron-based System** (`<cron>`)
- **Implementation**: JavaScript-based using the `node-cron` npm package (v4.2.1)
- **NOT system crontab**: It does not use the operating system's crontab. Instead, it's a pure JavaScript cron expression parser and scheduler
- **How it works**: 
  - Parses standard cron expressions (e.g., `"0 9 * * *"` for daily at 9 AM)
  - Uses JavaScript timers internally to schedule tasks
  - Runs in the Node.js process, not as system cron jobs
- **Status**: ✅ Working correctly

### 2. **Interval-based Schedule** (`<schedule>`)
- **Implementation**: JavaScript-based using Node.js `setInterval()`
- **How it works**:
  - Simple interval in seconds (e.g., `interval="60"` for every 60 seconds)
  - Executes task immediately once, then repeats at specified interval
- **Status**: ⚠️ **Has a bug - output is not displayed**

## The Problem with `<schedule>`

**Issue**: The `<schedule>` tag executes tasks successfully but **doesn't display any output**.

**Root Cause**: The `executeTask()` function in schedule.ts is missing output handling code that exists in the cron implementation.

### Comparison

**Cron (working):**
```typescript
async function executeJob(...) {
  try {
    // Clear previous output
    session.output = [];
    
    // Execute the children in the current session context
    await integrateChildren(session, element);
    
    // Print any output generated
    if (session.output.length > 0) {
      console.log(session.output.join(''));
    }
  } catch (error: any) {
    console.error(`[cron] Job "${name}" failed:`, error.message);
  }
}
```

**Schedule (broken):**
```typescript
async function executeTask(...) {
  try {
    // Execute the children in the current session context
    await integrateChildren(session, element);
    // ❌ Missing: output clearing and printing!
  } catch (error: any) {
    console.error(`[schedule] Task "${name}" failed:`, error.message);
  }
}
```

### Missing Code

The schedule implementation needs these lines added after executing children:

```typescript
// Clear output before execution
session.output = [];

// ... execute children ...

// Print output after execution
if (session.output.length > 0) {
  console.log(session.output.join(''));
}
```

## Other Findings

Both implementations:
- Run non-blocking (don't block main execution)
- Support named tasks that can be stopped/listed
- Prevent overlapping executions (skip if previous execution still running)
- Continue running until shell exit

## Recommendations

1. **Fix the `<schedule>` tag** by adding output handling (same as cron)
2. The cron system is fine as-is - it's JavaScript-based by design, which is good because:
   - Works cross-platform (no OS crontab dependency)
   - Easier to debug and manage
   - Tasks share the same session/context
   - No need for root/admin permissions

## Test Case

To verify the bug:

```xml
<schedule interval="5" name="test">
  <echo>This message should appear every 5 seconds</echo>
</schedule>
```

Currently, this runs but doesn't print anything. With the fix, it will print the message every 5 seconds.

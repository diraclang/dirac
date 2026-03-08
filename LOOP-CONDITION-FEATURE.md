# Loop Condition Feature - Implementation Summary

## Overview

Added condition-based loop support to the `<loop>` tag, enabling while-loop style iteration for service monitoring and long-running processes in containers.

## Changes Made

### 1. Core Implementation (`src/tags/loop.ts`)

Modified the loop tag to support three modes:

- **Count-only**: `<loop count="5">` - Traditional for-loop (backward compatible)
- **Condition-only**: `<loop condition="${running}">` - While-loop style
- **Combined**: `<loop count="10" condition="${done}">` - Safety-limited while-loop

Key changes:
- Changed from `for` loop to `while` loop structure
- Added `evaluateCondition()` helper function
- Support for infinite iterations when no count specified
- Condition evaluated each iteration with variable substitution
- Boolean evaluation handles: `true/false`, `1/0`, `yes/no`, truthiness

### 2. Unit Tests

Created 6 comprehensive test files in `tests/`:

1. `loop-condition-basic.test.di` - Basic while-loop behavior
2. `loop-condition-false-start.test.di` - False condition from start
3. `loop-condition-count-limit.test.di` - Combined with count limit
4. `loop-condition-early-exit.test.di` - Condition stops before count
5. `loop-condition-break.test.di` - Break in condition loop
6. `loop-condition-monitoring.test.di` - Service monitoring pattern

**All tests pass**: 63/63 (added 6 new tests)

### 3. Documentation

Created comprehensive documentation:

- `docs/tags/loop.md` - Full tag reference with examples
- Updated `tests/README.md` - Test coverage statistics
- `examples/monitor-logs.di` - Complete monitoring service example
- `examples/Dockerfile.monitor` - Container deployment example

### 4. Examples

**Log Monitoring Service** (`examples/monitor-logs.di`):
- Infinite loop with condition for graceful shutdown
- Periodic log file checks with LLM analysis
- Critical alert notifications via HTTP POST
- Sleep between checks to avoid CPU spinning
- Production-ready container deployment pattern

## Use Cases Enabled

### Container Services
```xml
<loop condition="${running}">
  <!-- Check logs -->
  <input name="logs" src="/var/log/app.log" />
  
  <!-- Analyze with LLM -->
  <llm output="analysis">...</llm>
  
  <!-- Take action -->
  <system>curl -X POST ...</system>
  
  <!-- Sleep until next check -->
  <system>sleep 3600</system>
</loop>
```

### Graceful Shutdown
```xml
<loop condition="${running}">
  <!-- Service logic -->
  <if condition="${shutdown_signal}">
    <assign name="running" value="false" />
  </if>
</loop>
```

### Safety-Limited Processing
```xml
<loop count="1000" condition="${notDone}">
  <!-- Process data with max iteration limit -->
</loop>
```

## Backward Compatibility

✅ All existing count-based loops continue to work unchanged
✅ No breaking changes to API or syntax
✅ Optional attribute (condition is optional if count provided)

## Testing Results

```
Tests: 63 passed, 0 failed, 63 total
```

New loop condition tests:
- ✅ Condition-based loops stop when condition becomes false
- ✅ False condition from start prevents execution
- ✅ Combined count+condition respects both limits
- ✅ Early exit when condition becomes false before count reached
- ✅ Break statement works in condition loops
- ✅ Monitoring pattern with incremental checks

## Container Deployment Pattern

The feature enables running Dirac as a long-running service:

**Dockerfile**:
```dockerfile
FROM node:20-alpine
RUN npm install -g dirac-lang
COPY monitor.di /app/
CMD ["dirac", "/app/monitor.di"]
```

**No need for**:
- System cron daemon
- Interactive docker exec
- External schedulers
- Watchdog processes

**Dirac script runs continuously** with condition-based loop + sleep.

## Implementation Details

### Loop Structure Change

**Before** (for-loop):
```typescript
for (let i = 0; i < count; i++) {
  setVariable(session, varName, i, false);
  await integrateChildren(session, element);
  if (session.isBreak) break;
}
```

**After** (while-loop):
```typescript
let maxIterations = countAttr ? parseInt(...) : Infinity;
let i = 0;

while (i < maxIterations) {
  // Check condition if provided
  if (conditionAttr) {
    const conditionValue = evaluateCondition(session, substitutedCondition);
    if (!conditionValue) break;
  }
  
  setVariable(session, varName, i, false);
  await integrateChildren(session, element);
  
  if (session.isBreak) { session.isBreak = false; break; }
  if (session.isReturn) break;
  i++;
}
```

### Condition Evaluation

```typescript
function evaluateCondition(session: DiracSession, condition: string): boolean {
  const trimmed = condition.trim();
  
  // Explicit boolean literals
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  
  // Numeric and string literals
  if (trimmed === '1' || trimmed.toLowerCase() === 'yes') return true;
  if (trimmed === '0' || trimmed === '' || trimmed.toLowerCase() === 'no') return false;
  
  // Truthiness for everything else
  return !!trimmed && trimmed !== '0';
}
```

## Files Modified

1. `src/tags/loop.ts` - Core implementation
2. `tests/loop-condition-basic.test.di` - New test
3. `tests/loop-condition-false-start.test.di` - New test
4. `tests/loop-condition-count-limit.test.di` - New test
5. `tests/loop-condition-early-exit.test.di` - New test
6. `tests/loop-condition-break.test.di` - New test
7. `tests/loop-condition-monitoring.test.di` - New test
8. `tests/README.md` - Updated statistics
9. `docs/tags/loop.md` - New documentation (NEW FILE)
10. `examples/monitor-logs.di` - Example service (NEW FILE)
11. `examples/Dockerfile.monitor` - Deployment example (NEW FILE)

## Next Steps (Future Enhancements)

Potential future improvements (not in scope):

1. **Signal handling**: Catch SIGTERM/SIGINT to set `${running}` to false
2. **Complex conditions**: Support expressions like `${x} > 10 && ${y} < 20`
3. **Timed conditions**: Built-in timeout support
4. **Event triggers**: Condition based on file system events
5. **Distributed loops**: Coordinate across multiple containers

These can be added incrementally without breaking changes.

## Summary

✅ Implemented condition attribute for `<loop>` tag
✅ Created 6 comprehensive unit tests (all passing)
✅ Full documentation with examples and use cases
✅ Production-ready monitoring service example
✅ Container deployment pattern documented
✅ Backward compatible with existing code
✅ Zero breaking changes

The feature enables Dirac to run as a long-running service in containers for log monitoring, event processing, and other background tasks without requiring external schedulers like cron.

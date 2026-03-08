# Loop Tag Documentation

## Overview

The `<loop>` tag provides iteration capabilities with support for both count-based (for-loop style) and condition-based (while-loop style) loops.

## Syntax

```xml
<!-- Count-based loop (for-loop style) -->
<loop count="N" var="varName">
  <!-- loop body -->
</loop>

<!-- Condition-based loop (while-loop style) -->
<loop condition="${expression}">
  <!-- loop body -->
</loop>

<!-- Combined: count with condition (safety limit) -->
<loop count="N" condition="${expression}" var="varName">
  <!-- loop body -->
</loop>
```

## Attributes

- **count** (optional): Number of iterations (integer). Can use variable substitution.
- **condition** (optional): Boolean expression to evaluate each iteration. Loop continues while true.
- **var** (optional): Variable name for loop counter (default: `i`). Available inside loop body.

**Note**: At least one of `count` or `condition` must be provided.

## Condition Evaluation

The `condition` attribute supports:

- Boolean literals: `true`, `false`
- Numeric literals: `1` (true), `0` (false)
- String literals: `yes` (true), `no` (false), `""` (false)
- Variable references: `${running}`, `${keepGoing}`
- Truthiness: Non-empty, non-zero values are true

The condition is evaluated **before** each iteration using variable substitution.

## Loop Variable

The loop variable (default `i`, or custom via `var` attribute) contains:
- Current iteration index (starts at 0)
- Available for use in loop body
- Automatically incremented after each iteration

## Examples

### Basic Count Loop

```xml
<defvar name="result" value="" />
<loop count="5">
  <assign name="result">
    <variable name="result" />x
  </assign>
</loop>
<output><variable name="result" /></output>
<!-- Output: xxxxx -->
```

### Custom Loop Variable

```xml
<defvar name="sum" value="0" />
<loop count="10" var="idx">
  <assign name="sum">
    <expr eval="plus">
      <arg><variable name="sum" /></arg>
      <arg><variable name="idx" /></arg>
    </expr>
  </assign>
</loop>
<output><variable name="sum" /></output>
<!-- Output: 45 (0+1+2+...+9) -->
```

### Variable Count

```xml
<defvar name="n" value="7" />
<loop count="${n}">
  <output>Iteration <variable name="i" /></output>
</loop>
```

### Condition-Based Loop (While Loop)

```xml
<defvar name="counter" value="0" />
<defvar name="running" value="true" />

<loop condition="${running}">
  <output>Check <variable name="counter" /></output>
  
  <assign name="counter">
    <expr eval="plus">
      <arg><variable name="counter" /></arg>
      <arg>1</arg>
    </expr>
  </assign>
  
  <if condition="${counter} == 5">
    <assign name="running" value="false" />
  </if>
</loop>
```

### Infinite Loop with Break

```xml
<defvar name="running" value="true" />
<defvar name="count" value="0" />

<loop condition="${running}">
  <assign name="count">
    <expr eval="plus">
      <arg><variable name="count" /></arg>
      <arg>1</arg>
    </expr>
  </assign>
  
  <if condition="${count} == 100">
    <break />
  </if>
  
  <!-- Process something -->
</loop>
```

### Combined: Count with Condition (Safety Limit)

```xml
<!-- Run up to 1000 iterations, but stop early if done -->
<defvar name="done" value="false" />
<defvar name="processed" value="0" />

<loop count="1000" condition="${done} == false">
  <!-- Process data -->
  <assign name="processed">
    <expr eval="plus">
      <arg><variable name="processed" /></arg>
      <arg>1</arg>
    </expr>
  </assign>
  
  <!-- Check if complete -->
  <if condition="${processed} >= ${targetCount}">
    <assign name="done" value="true" />
  </if>
</loop>
```

## Container/Service Monitoring Pattern

Perfect for long-running services in containers:

```xml
<defvar name="running" value="true" />

<loop condition="${running}">
  <!-- Read log file -->
  <input name="logs" src="/var/log/app.log" mode="tail" lines="100" />
  
  <!-- Analyze with LLM -->
  <llm output="analysis">
    Analyze these logs for errors: ${logs}
  </llm>
  
  <!-- Take action if needed -->
  <if condition="${analysis} contains CRITICAL">
    <system>curl -X POST https://alerts.example.com/notify ...</system>
  </if>
  
  <!-- Sleep until next check -->
  <system>sleep 3600</system>
</loop>
```

Deploy in Docker:

```dockerfile
FROM node:20-alpine
RUN npm install -g dirac-lang
COPY monitor.di /app/
CMD ["dirac", "/app/monitor.di"]
```

## Use Cases

### Count-Based (Traditional For Loop)
- Fixed iterations over known ranges
- Array/list processing with known size
- Batch operations with defined count
- Nested iteration structures

### Condition-Based (While Loop)
- **Service monitoring** - continuous log analysis
- **Event processing** - run until shutdown signal
- **Polling** - check resources until available
- **Data processing** - continue until completion
- **Container services** - long-running background tasks

### Combined (Safety-Limited While Loop)
- Prevent infinite loops with max iterations
- Bounded retries with early exit
- Progressive processing with timeout
- Development/testing of monitoring scripts

## Control Flow

### Break Statement

Use `<break/>` to exit loop early:

```xml
<loop count="100">
  <if condition="${i} == 50">
    <break />
  </if>
  <output><variable name="i" /></output>
</loop>
<!-- Outputs 0 through 49, then stops -->
```

Works with both count and condition loops.

### Return Statement

Using `<return/>` inside a subroutine exits both the loop and the subroutine:

```xml
<subroutine name="find-first-match">
  <loop condition="${running}">
    <if condition="${found}">
      <return value="${result}" />
    </if>
  </loop>
</subroutine>
```

## Error Handling

### Missing Attributes

```xml
<!-- ERROR: requires either count or condition -->
<loop>
  <output>test</output>
</loop>
```

Error message: `<loop> requires either count or condition attribute`

### Invalid Count

```xml
<!-- ERROR: count must be a valid integer -->
<loop count="abc">
  <output>test</output>
</loop>
```

Error message: `Invalid loop count: abc`

### False Condition from Start

If condition is false at the start, loop body never executes:

```xml
<defvar name="shouldRun" value="false" />
<loop condition="${shouldRun}">
  <output>This will never print</output>
</loop>
```

## Performance Considerations

### Infinite Loops

Be careful with condition-based loops to avoid infinite execution:

```xml
<!-- BAD: Infinite loop if 'running' never changes -->
<defvar name="running" value="true" />
<loop condition="${running}">
  <output>Running forever...</output>
</loop>
```

**Solution 1**: Use combined count+condition for safety:

```xml
<loop count="1000" condition="${running}">
  <!-- Max 1000 iterations -->
</loop>
```

**Solution 2**: Include break condition:

```xml
<loop condition="${running}">
  <if condition="${i} > 100">
    <break />
  </if>
</loop>
```

**Solution 3**: For services, include sleep to avoid CPU spinning:

```xml
<loop condition="${running}">
  <!-- Do work -->
  <system>sleep 60</system>  <!-- Prevent tight loop -->
</loop>
```

### Variable Substitution Overhead

Condition is evaluated every iteration with `substituteAttribute()`. For tight loops, prefer count-based when possible.

## Testing

Unit tests available in `tests/loop-condition-*.test.di`:

- `loop-condition-basic.test.di` - Basic while-loop behavior
- `loop-condition-false-start.test.di` - False condition from start
- `loop-condition-count-limit.test.di` - Combined with count limit
- `loop-condition-early-exit.test.di` - Condition stops before count
- `loop-condition-break.test.di` - Break in condition loop
- `loop-condition-monitoring.test.di` - Service monitoring pattern

Run tests:

```bash
npm test -- tests/loop-condition-*.test.di
```

## See Also

- `<break>` - Exit loop early
- `<if>` - Conditional logic
- `<system>` - Execute system commands (e.g., sleep)
- `examples/monitor-logs.di` - Complete monitoring service example

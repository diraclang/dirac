# LLM Tag Multi-Turn (ReAct) Architecture

## Current Implementation

The `<llm>` tag supports multi-turn agentic flows via the **feedback mode**:

```xml
<llm execute="true" feedback="true" max-iterations="5">
  Create a greeting function
</llm>
```

### How It Works

1. **LLM generates code** → Dirac XML
2. **Code executes** → Captures output
3. **Output sent back to LLM** → "Is this correct?"
4. **LLM responds** → Either "DONE" or generates new code
5. **Repeat** until done or max iterations

### Current Behavior (Blocking)

```typescript
while (iteration < maxIterations && (iteration === 0 || feedbackMode)) {
  // LLM call (network I/O)
  // Execute code
  // Capture output
  // Send feedback to LLM
  // Repeat...
}
```

**Problem**: This loop is **synchronous and blocks** until completion:
- User sees no output until entire loop finishes
- No way to interrupt multi-turn flow
- For 5-10 iterations, could take 30-60+ seconds with no feedback

### Output Streaming

**Current state**: Output from each `integrate()` call IS added to `session.output` during the loop, BUT:
- In shell mode, output isn't flushed to terminal until llm tag returns
- User experiences a "freeze" during multi-turn execution

## Solutions

### Option 1: Progressive Output (Implemented)
- Added iteration markers: `--- Iteration 2/5 ---`
- Output from `integrate()` already goes to `session.output`
- Still blocks, but at least shows progress

### Option 2: True Streaming (Not Implemented)
Would require architectural changes:
```typescript
// Emit output immediately during loop
while (...) {
  await integrate(session, dynamicAST);
  
  // Flush output to terminal NOW, not later
  for (const item of newOutputItems) {
    process.stdout.write(item);
  }
  session.output = []; // Clear after flushing
}
```

**Challenges**:
- Shell expects `session.output` to accumulate
- Other tags might break if output is cleared mid-execution
- Would need separate "streaming mode" flag

### Option 3: Background Execution (Future)
Run ReAct loop in worker thread/background:
```typescript
<llm execute="true" feedback="true" background="true">
  Long-running task
</llm>
<!-- Returns immediately, streams updates asynchronously -->
```

**Challenges**:
- Session state isolation
- Thread safety
- Complexity

## Current Recommendation

**For now**: The blocking behavior is acceptable because:
1. User explicitly requests multi-turn with `feedback="true"`
2. Iteration markers show progress
3. Most real-world use cases: 1-3 iterations = 10-30 seconds
4. Can set `max-iterations="1"` for single-turn

**Future improvement**: Add `stream="true"` attribute that flushes output progressively.

## Example Usage

### Single-turn (non-blocking, fast):
```xml
<llm execute="true">Generate a hello world function</llm>
```

### Multi-turn with progress markers:
```xml
<llm execute="true" feedback="true" max-iterations="5">
  Create a complex data analysis pipeline
</llm>
```

Output:
```
[Generated code executes...]
--- Iteration 2/5 ---
[Execution output...]
--- Iteration 3/5 ---
[More output...]
DONE
```

### With stop plugin:
```xml
<llm execute="true" feedback="true" max-iterations="10" on-iteration="check-quality">
  Keep improving until perfect
</llm>
```

The `check-quality` subroutine can set `__llm_stop_requested__=true` to exit early.

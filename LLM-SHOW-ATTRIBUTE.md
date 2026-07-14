# LLM Tag `show` Attribute

## Overview
The `show` attribute on the `<LLM>` tag controls which subroutines are visible to the language model when building the system prompt.

## Syntax
```xml
<LLM show="boundary|all" ...>
  prompt content
</LLM>
```

## Values

### `show="all"` (default)
Shows all subroutines in the entire stack, regardless of boundaries. This gives the LLM complete visibility into all available functionality.

**Use when:**
- Working at the top level (most common)
- Need access to global utilities
- Building high-level orchestration logic
- Want maximum flexibility for code generation

### `show="boundary"`
Shows only subroutines registered at or after the current subroutine boundary. This limits the LLM's context to the current scope only, excluding parent/global subroutines. Useful for reducing token usage in deeply nested scopes.

**Use when:**
- Working within a deeply nested scope
- Want to reduce prompt size and token costs
- Need focused context limited to local subroutines only
- Deliberately excluding parent scope utilities

## Examples

### Example 1: Default "All" Mode
```xml
<!-- Global utilities visible to LLM -->
<subroutine name="log" description="Log message">
  <param name="msg"/>
</subroutine>

<subroutine name="set-color" description="Set background color">
  <param name="color"/>
</subroutine>

<!-- LLM sees all subroutines by default -->
<LLM model="gpt-4" output="result">
  Set the background color to blue and log a message
</LLM>
```

### Example 2: Boundary Mode for Nested Scopes
```xml
<subroutine name="process-data">
  <subroutine name="validate" description="Validate data format">
    <param name="data"/>
    <!-- validation logic -->
  </subroutine>
  
  <subroutine name="transform" description="Transform data">
    <param name="data"/>
    <!-- transform logic -->
  </subroutine>
  
  <!-- With show="boundary", LLM only sees 'validate' and 'transform' (current scope) -->
  <LLM model="gpt-4" output="result" show="boundary">
    Create a pipeline to process the data
  </LLM>
</subroutine>
```

## Technical Details

### How Boundaries Work
DIRAC maintains a subroutine boundary marker (`session.subBoundary`) that tracks scope levels. When a subroutine creates a new scope:

1. Boundary is set to current subroutine stack length
2. New subroutines registered get marked with this boundary
3. When scope exits, subroutines below boundary can be cleaned up

The `show` attribute uses this boundary information to filter what's visible to the LLM.

### Filtering Logic
```typescript
// With show="all" (default)
const visible = allSubroutines; // No filtering

// With show="boundary"
const currentBoundary = session.subBoundary;
const visible = allSubroutines.filter(sub => 
  sub.boundary >= currentBoundary
);
```

### Performance Impact
Using `show="boundary"` can reduce prompt size in deeply nested scopes:
- **Token usage**: Excludes parent scope subroutines
- **Prompt size**: Only includes current scope context
- **Focus**: LLM sees only local utilities

Example: Inside a nested subroutine with 5 local helpers and 50 global ones:
- `show="all"`: ~55 subroutines in prompt (default, maximum context)
- `show="boundary"`: ~5 subroutines in prompt
- **Savings**: ~90% reduction in subroutine documentation tokens

**Note**: Most use cases benefit from the default `show="all"` behavior. Only use `show="boundary"` when you specifically want to hide parent scope subroutines.

## Debugging
Enable debug mode to see filtering in action:
```xml
<LLM model="gpt-4" show="boundary">
  <!-- Debug output will show:
       [LLM] Filtered to boundary 42: 5/50 subroutines visible
  -->
  prompt here
</LLM>
```

## Related
- `hide-from-llm` metadata: Hides specific subroutines regardless of boundary
- `noextra` attribute: Disables all subroutine reflection
- See `NAMESPACES.md` for more on scope management

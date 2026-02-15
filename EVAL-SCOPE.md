# EVAL Scope and Variable Injection

## The Problem

DIRAC's `<eval>` tag and subroutine parameters inject variables directly into the JavaScript execution scope. This creates a **namespace collision risk** with JavaScript built-ins and Node.js modules.

### Example of the Issue

```xml
<subroutine name="get" param-path="string:required">
  <eval>
    // 'path' is injected as a parameter variable
    // BUT 'path' is also a Node.js built-in module!
    // Result: param-path attribute is shadowed by Node.js path module
    console.log(path); // Prints: { resolve: [Function], join: [Function], ... }
  </eval>
</subroutine>
```

### Known Conflicts

Node.js built-in module names that will cause conflicts:
- `path` - File path utilities
- `fs` - File system
- `url` - URL parsing
- `os` - Operating system utilities
- `util` - Utility functions
- `crypto` - Cryptography
- `stream` - Stream utilities
- `events` - Event emitter
- `buffer` - Buffer utilities
- `process` - Process information
- `console` - Console logging
- `module` - Module system
- `assert` - Assertions
- `child_process` - Child processes
- `cluster` - Cluster utilities
- `dns` - DNS lookups
- `http` / `https` - HTTP client/server
- `net` - Network utilities
- `querystring` - Query string parsing
- `readline` - Readline interface
- `string_decoder` - String decoder
- `timers` - Timer functions
- `tls` - TLS/SSL
- `tty` - TTY utilities
- `vm` - V8 virtual machine
- `zlib` - Compression
- `perf_hooks` - Performance hooks
- `async_hooks` - Async hooks
- `worker_threads` - Worker threads

JavaScript global objects that can cause conflicts:
- `Object`, `Array`, `String`, `Number`, `Boolean`, `Date`, `RegExp`, `Error`
- `JSON`, `Math`, `Promise`, `Map`, `Set`, `WeakMap`, `WeakSet`
- `Symbol`, `Proxy`, `Reflect`
- `parseInt`, `parseFloat`, `isNaN`, `isFinite`
- `eval`, `Function`

## Current Workaround

Use naming conventions to avoid conflicts:

### ✅ Safe Parameter Names
```xml
<subroutine name="get" param-jsonPath="string">  <!-- Use camelCase prefix -->
<subroutine name="process" param-dataValue="string">  <!-- Avoid 'data', use 'dataValue' -->
<subroutine name="parse" param-urlString="string">  <!-- Avoid 'url', use 'urlString' -->
```

### ❌ Unsafe Parameter Names
```xml
<subroutine name="get" param-path="string">  <!-- Conflicts with Node.js path module -->
<subroutine name="process" param-data="string">  <!-- Risk if 'data' becomes a module -->
<subroutine name="parse" param-url="string">  <!-- Conflicts with Node.js url module -->
```

## Why This Is Hard to Fix

### Problem: Backward Compatibility
The `<eval>` tag is **widely used** throughout the DIRAC ecosystem:
- Core tags use it (`<if>`, `<loop>`, `<defvar>`, etc.)
- Libraries depend on it (`dirac-json`, `dirac-mongodb`, `dirac-http`, etc.)
- User scripts use it extensively
- Changing the variable injection mechanism would **break all existing code**

### Potential Solutions

#### ✅ Recommended: Opt-in Attribute (Safe Flag)
```xml
<subroutine name="get" param-path="string">
  <eval safe="true">  <!-- Opt-in to safe mode -->
    // All parameters under 'params' namespace object
    const myPath = params.path;
    
    // Session variables also namespaced
    const myVar = vars.myVariable;
  </eval>
</subroutine>

<!-- Legacy behavior (default) -->
<subroutine name="old" param-data="string">
  <eval>  <!-- No 'safe' flag, backward compatible -->
    const value = data;  // Direct injection (old way)
  </eval>
</subroutine>
```

**Advantages**:
- ✅ **Backward compatible**: Existing code works unchanged
- ✅ **Opt-in migration**: Update code at your own pace
- ✅ **Same tag**: No need for `<eval-safe>` or new syntax
- ✅ **Clear intent**: `safe="true"` explicitly marks namespaced behavior
- ✅ **Gradual adoption**: Can mix old and new in same codebase

**Implementation**:
```javascript
// In src/tags/eval.ts
const safeMode = node.getAttribute('safe') === 'true';

if (safeMode) {
  // Inject parameters and variables under namespace objects
  evalContext.params = { path: '...', key: '...' };
  evalContext.vars = session.variables;
} else {
  // Legacy: Direct injection (current behavior)
  evalContext.path = '...';
  evalContext.key = '...';
}
```

#### Alternative: Prefix Convention (Automatic)
```xml
<subroutine name="get" param-path="string">
  <eval>
    // Runtime automatically prefixes: param_path, var_myVariable
    const myPath = param_path;
  </eval>
</subroutine>
```
**Disadvantage**: Still breaks existing code, just with different names

#### Alternative: New Tag
```xml
<eval-safe>  <!-- Completely new tag -->
  const myPath = params.path;
</eval-safe>
```
**Disadvantage**: Code duplication, two tags doing same thing

## Recommendation

### Short Term (v0.1.x - v0.2.x)
1. **Document the issue clearly** ✅ (this file)
2. **Establish naming conventions**: Use camelCase with descriptive prefixes
3. **Update existing libraries** to avoid conflicts (e.g., `param-path` → `param-jsonPath`)
4. **Add linter warnings** for known conflicts in parameter names

### Medium Term (v0.3.0 - v0.4.0)
1. **Implement `safe="true"` flag** in `<eval>` tag
2. **Update documentation** with safe mode examples
3. **Migrate core libraries** to use safe mode incrementally
4. **Provide migration guide** showing side-by-side examples

### Long Term (v1.0.0+)
1. **Make `safe="true"` the recommended default** in documentation
2. **Add deprecation warnings** for unsafe parameter names without safe flag
3. **Keep legacy behavior** for backward compatibility (never remove it)
4. **All new code examples** use safe mode

### Migration Timeline
```
v0.1.32 (current) - Document issue, fix critical conflicts (dirac-json)
v0.2.0            - Add linter warnings for parameter name conflicts
v0.3.0            - Implement safe="true" flag in <eval> tag
v0.4.0            - Migrate core libraries to safe mode, provide migration tools
v0.5.0            - Add deprecation warnings for unsafe names
v1.0.0            - safe="true" recommended as default (legacy still works)
```

## Implementation Details

### How `safe="true"` Works

```typescript
// In src/tags/eval.ts
async function executeEval(node: Element, session: Session): Promise<any> {
  const safeMode = node.getAttribute('safe') === 'true';
  const code = node.textContent || '';
  
  // Build evaluation context
  const evalContext: any = { session };
  
  if (safeMode) {
    // Safe mode: Namespace injection
    evalContext.params = extractParameters(node);
    evalContext.vars = buildVariableMap(session.variables);
    evalContext.env = process.env;
  } else {
    // Legacy mode: Direct injection (current behavior)
    Object.assign(evalContext, extractParameters(node));
    // Variables accessible directly by name
    for (const v of session.variables) {
      evalContext[v.name] = v.value;
    }
  }
  
  // Execute
  return await vm.runInNewContext(code, evalContext);
}
```

### Usage Examples

#### Migrating to Safe Mode

**Before (Legacy)**:
```xml
<subroutine name="get" param-jsonPath="string">
  <eval>
    const parts = jsonPath.split('.');
    return parts[0];
  </eval>
</subroutine>
```

**After (Safe Mode)**:
```xml
<subroutine name="get" param-path="string">
  <eval safe="true">
    // Can now use 'path' safely - no conflict!
    const parts = params.path.split('.');
    return parts[0];
  </eval>
</subroutine>
```

#### Accessing Session Variables

**Before (Legacy)**:
```xml
<eval>
  const result = myVariable * 2;  // Direct access
</eval>
```

**After (Safe Mode)**:
```xml
<eval safe="true">
  const result = vars.myVariable * 2;  // Namespaced access
</eval>
```

#### Environment Variables

**Safe mode provides explicit namespace**:
```xml
<eval safe="true">
  const apiKey = env.API_KEY;  // Clear that it's environment
  const dbHost = params.host;   // Clear that it's a parameter
  const data = vars.userData;   // Clear that it's a session variable
</eval>
```

## Impact Analysis

### Low Risk Changes (Can do now)
- Rename parameters in libraries: `path` → `jsonPath`, `filePath`, etc.
- Update documentation with best practices
- Add parameter naming guidelines

### High Risk Changes (Need major version)
- Change variable injection mechanism
- Introduce new evaluation tag
- Break backward compatibility

## Best Practices Going Forward

1. **Never use single-word Node.js module names** as parameters
2. **Always use descriptive, prefixed names**: `jsonPath`, `filePath`, `urlString`
3. **Avoid common JavaScript terms**: `data`, `value`, `result` (use `dataValue`, `returnValue`, `resultValue`)
4. **Test parameters** in eval blocks to ensure they're not module objects
5. **Document parameter naming conventions** in library READMEs

## Examples from dirac-json

### Before (Broken)
```xml
<subroutine name="get" param-path="string">
  <eval>
    // 'path' is the Node.js path module, not our parameter!
    const parts = path.match(/\./g);  // TypeError: path.match is not a function
  </eval>
</subroutine>
```

### After (Fixed)
```xml
<subroutine name="get" param-jsonPath="string">
  <eval>
    // 'jsonPath' is our parameter, no conflict
    const parts = jsonPath.match(/\./g);  // Works correctly
  </eval>
</subroutine>
```

## Conclusion

This is a **fundamental architectural decision** that affects the entire DIRAC ecosystem. We cannot fix it without breaking changes, so we must:

1. **Document it thoroughly** ✅ (this file)
2. **Establish clear conventions** ✅ (use prefixed camelCase names)
3. **Fix critical issues incrementally** 🔄 (dirac-json, dirac-rdbms, etc.)
4. **Plan for v1.0.0 breaking change** 📅 (introduce safe eval mechanism)

The cost of changing this later increases with every library and script written. However, changing it now would break too much existing code. The compromise is **clear documentation and naming conventions** until we can introduce a better mechanism in a major version.

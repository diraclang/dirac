# Dirac Unit Test Coverage Report

## Summary
- **Total Tests**: 32
- **Passing**: 20 (62.5%)
- **Failing**: 12 (37.5%)

## Test Status by Tag

### ✅ Fully Covered (Passing)
- `<output>` - Basic output, multiple outputs
- `<defvar>` - Variable definition, multiple variables  
- `<variable>` - Variable interpolation
- `<assign>` - Basic assignment
- `<eval>` - Basic eval, eval with variables, eval naming
- `<loop>` - Basic loops
- `<test-if>` - Attribute-based conditional testing
- `<system>` - Basic system commands
- `<require_module>` - Node.js module imports
- `<subroutine>` - Basic subroutine calls
- `<try>/<catch>` - Error handling, error expectations
- `<exception>` - Exception handling

### ⚠️ Partially Covered (Has Issues)
- `<expr>` - Syntax needs fixing (requires `eval` attribute)
- `<call>` - Subroutine calls (parameter definition issues)
- `<loop>` - Nested loops (logic issues)
- `<import>` - Import functionality (needs investigation)
- `<system>` - Output capture order

### ❌ Not Tested
- `<llm>` - Requires LLM provider configuration
- `<execute>` - Requires LLM provider configuration  
- `<mongodb>` - Requires MongoDB connection
- `<if>` - Conditional expression evaluation (different from test-if)
- `<parameters>` - HTTP parameter extraction

## Failing Tests Details

### 1. call_basic & call_with_output
**Issue**: Subroutine parameter binding
```
Error: Eval error: x is not defined
```
**Fix Needed**: Verify param-* attribute syntax

### 2. expr_basic & expr_string_concat  
**Issue**: Missing `eval` attribute
```
Error: <expr> requires eval or op attribute
```
**Already Fixed**: Changed to `<expr eval="..." />`

### 3. if_else & if_with_variables
**Issue**: test-if syntax
```
Error: <test-if> requires test attribute  
```
**Fix Needed**: Use proper test-if syntax with `test="$var"` and comparison operators

### 4. import_basic
**Issue**: Import not finding parameter
```
Error: Eval error: x is not defined
```
**Fix Needed**: Check import mechanism and subroutine parameter passing

### 5. loop_nested
**Issue**: Logic error in nested loop test
```
Expected: "0-A 0-B 1-A 1-B"
Actual: "0-B 0-B 1-B 1-B"  
```
**Fix Needed**: Fix letter calculation logic

### 6. subroutine_multiple_params & subroutine_recursive
**Issue**: Output variable not captured
```
Expected: "Full name: John Doe"
Actual: "Full name:"
```
**Fix Needed**: Check param-output and eval output assignment

### 7. system_capture & system_with_trim
**Issue**: Output order
```
Expected: "hello Result: hello"
Actual: "hello Result:"
```
**Fix Needed**: System command output comes first, variable not captured

## Next Steps

1. **High Priority** - Fix subroutine parameter passing (4 tests)
2. **Medium Priority** - Fix expr and test-if syntax (4 tests)  
3. **Low Priority** - Fix system output capture (2 tests), loop logic (1 test), import (1 test)
4. **Future** - Add LLM/MongoDB integration tests when services available

## Test Execution

```bash
npm test
```

All tests run automatically on build. Test files are in `/tests` directory with format:
```xml
<!-- TEST: test_name -->
<!-- EXPECT: expected output -->
<!-- EXPECT_ERROR: expected error message -->
<dirac>
  <!-- test code -->
</dirac>
```

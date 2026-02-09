# Dirac Test Suite

Comprehensive unit tests for all Dirac tags and features.

## Running Tests

```bash
npm test
```

## Test Coverage

### Core Tags
- ✅ `<output>` - Basic output, multiple outputs
- ✅ `<defvar>` - Variable definition, multiple variables
- ✅ `<variable>` - Variable interpolation
- ✅ `<assign>` - Basic assignment, assignment from eval
- ✅ `<eval>` - Basic eval, eval with variables
- ✅ `<expr>` - Basic expressions, string concatenation

### Control Flow
- ✅ `<if>` - Basic conditionals, with variables, else logic
- ✅ `<loop>` - Basic loops, nested loops, loops with eval

### Functions
- ✅ `<subroutine>` - Basic subroutines, multiple params, recursive
- ✅ `<call>` - Basic calls, calls with output
- ✅ `<import>` - Import external libraries
- ✅ `<parameters>` - Parameter definitions with defaults

### System Integration
- ✅ `<system>` - Basic system commands, output capture, trim
- ✅ `<require_module>` - Node.js module imports

### Error Handling
- ✅ `<try>` - Try blocks
- ✅ `<catch>` - Catch blocks, error variable
- ✅ `<throw>` - Throw custom errors
- ✅ `<exception>` - Exception handling

### Advanced (Need manual testing with LLM)
- ⚠️ `<llm>` - Requires LLM configuration
- ⚠️ `<execute>` - Requires LLM configuration
- ⚠️ `<mongodb>` - Requires MongoDB connection

## Test Format

Each test file follows this format:

```xml
<!-- TEST: test_name -->
<!-- EXPECT: expected output -->
<dirac>
  <!-- Test code here -->
</dirac>
```

## Adding New Tests

1. Create a new `.test.di` file in `/tests`
2. Add TEST and EXPECT comments
3. Write your test
4. Run `npm test`

## Test Statistics

- **Total Tests**: 32
- **Tag Coverage**: 19/24 tags (79%)
- **Missing Coverage**: llm, execute, mongodb (require external services)

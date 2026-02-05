# Dirac Testing System

A simple, lightweight testing framework for Dirac language files.

## Running Tests

```bash
npm test
```

This will:
1. Build the project
2. Run all `*.test.di` files in the `tests/` directory
3. Report results

## Writing Tests

Tests are standard Dirac `.di` files with special comments that define expectations.

### Test File Format

```xml
<!-- TEST: test_name -->
<!-- EXPECT: expected output -->
<dirac>
  <!-- your test code here -->
</dirac>
```

### Test Metadata Comments

- `<!-- TEST: name -->` - Name of the test (optional, defaults to filename)
- `<!-- EXPECT: output -->` - Expected output (optional)
- `<!-- EXPECT_ERROR: error message -->` - Expected error message (optional)

### Example Tests

#### Basic Output Test

```xml
<!-- TEST: hello_world -->
<!-- EXPECT: Hello, World! -->
<dirac>
  <output>Hello, World!</output>
</dirac>
```

#### Variable Test

```xml
<!-- TEST: variables -->
<!-- EXPECT: Value is: test123 -->
<dirac>
  <defvar name="myvar" value="test123" />
  <output>Value is: <variable name="myvar" /></output>
</dirac>
```

#### Error Test

```xml
<!-- TEST: missing_variable -->
<!-- EXPECT_ERROR: Variable 'missing' not found -->
<dirac>
  <variable name="missing" />
</dirac>
```

#### No Expectation (Just Run)

```xml
<!-- TEST: runs_without_error -->
<dirac>
  <defvar name="x" value="10" />
  <!-- Test passes if it runs without throwing an error -->
</dirac>
```

## Test Organization

Tests should be placed in the `tests/` directory with the `.test.di` extension:

```
tests/
  ├── basic-output.test.di
  ├── variable-basic.test.di
  ├── subroutine-basic.test.di
  ├── if-conditional.test.di
  └── ...
```

You can organize tests into subdirectories:

```
tests/
  ├── core/
  │   ├── output.test.di
  │   └── variables.test.di
  ├── control-flow/
  │   ├── if.test.di
  │   └── loop.test.di
  └── llm/
      └── basic.test.di
```

## Output Matching

The test runner normalizes whitespace when comparing output:
- Multiple spaces/newlines are collapsed to single spaces
- Leading/trailing whitespace is trimmed
- This allows tests to ignore XML formatting whitespace

For example, these are equivalent:
- Expected: `Hello World`
- Actual: `  Hello   World  ` → matches ✓
- Actual: `Hello\n  World` → matches ✓

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Continuous Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
```

## Best Practices

1. **One concept per test** - Each test should verify one specific behavior
2. **Descriptive names** - Use clear test names that describe what's being tested
3. **Test edge cases** - Include tests for error conditions and boundary cases
4. **Keep tests fast** - Avoid LLM calls in unit tests (use mocks or separate integration tests)
5. **Test regressions** - When fixing bugs, add a test to prevent regression

## Example Test Suite

```
tests/
  ├── basic-output.test.di          # Basic output functionality
  ├── variable-basic.test.di        # Variable definition and output
  ├── subroutine-basic.test.di      # Subroutine calls
  ├── if-conditional.test.di        # Conditional execution
  ├── loop-basic.test.di            # Loop functionality
  ├── exception-basic.test.di       # Exception handling
  └── test-if-basic.test.di         # test-if conditional
```

## Future Enhancements

Potential improvements:
- Watch mode for TDD workflow
- Code coverage reporting
- Performance benchmarks
- Parallel test execution
- Test fixtures/setup/teardown
- Snapshot testing for complex outputs

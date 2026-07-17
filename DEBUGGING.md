# Debugging Dirac

This guide covers debugging features in Dirac to help troubleshoot and understand code execution.

## Debug Mode

Enable debug mode to see detailed internal logs about validation, tag processing, and execution.

### Enabling Debug Mode

In the Dirac shell (dish):
```
:debug
```

This toggles debug mode on/off. When enabled, you'll see additional log messages to stderr.

In config.yml:
```yaml
debug: true
```

### Debug Output

When debug mode is enabled, you'll see:

#### Validation Logs

Tag validation messages show how Dirac validates and autocorrects tags:
```
[VALIDATE] Tag: <subroutine>, autocorrect: true, attributes: [ 'name', 'param-name' ]
[VALIDATE] Tag <subroutine> is valid
[VALIDATE] Tag <subroutine> has 1 parameters: [ 'name' ]
[VALIDATE] Found 1 local subroutine definitions: [ 'greet' ]
[VALIDATE] Temp subroutine 'greet' has 1 parameters: [ 'name' ]
```

Attribute validation and correction:
```
[VALIDATE] Unknown attribute 'nam' on <greet>
[VALIDATE] Checking similarity for 'nam' against: [ 'name' ]
[VALIDATE] Best match: name with score 0.89, cutoff: 0.75
[VALIDATE] Auto-corrected (similarity): nam → name
```

Deep validation of subroutines:
```
[VALIDATE] Deep validation of <subroutine name="greet">
[VALIDATE] Scope validation for <subroutine name="greet">: {
  errors: 0,
  warnings: 0,
  undefinedParams: [],
  undefinedVars: [],
  unusedParams: [],
  unusedVars: []
}
```

#### Apply Correction Logs

When autocorrection is applied to code:
```
[APPLY-CORRECTION] Processing <greet> with result #0 for <gret>, corrected: true
[APPLY-CORRECTION] Tag: gret → greet
[APPLY-CORRECTION] Attributes on <greet>: { nam: 'name' }
[APPLY-CORRECTION]   nam="World" → name="World"
```

#### LLM Original Responses

When using LLM tags with execute mode, the original LLM response is shown to stderr with separators:
```
============================================================
[LLM Original Response]
<subroutine name="greet" param-name="string:required">
  <echo>Hello, <get-variable name="name"/>!</echo>
</subroutine>
============================================================
```

This helps you see what the LLM generated before any validation or execution.

## When to Use Debug Mode

Enable debug mode when:

- **Autocorrection issues**: Tags or attributes being corrected incorrectly
- **Validation errors**: Understanding why a tag is invalid
- **LLM execution**: Seeing the raw LLM output before processing
- **Scope validation**: Checking parameter and variable usage
- **Development**: Building or testing Dirac features

Disable debug mode for:

- **Normal usage**: Cleaner output without internal logs
- **Production**: Reduce log noise
- **Scripting**: When you only need program output

## Other Debugging Features

### Stack Inspection

View current execution stack:
```
:stack
```

Shows all subroutines loaded in the current session.

### Subroutine Listing

List all available subroutines:
```
:list
```

### Variable Inspection

View session variables:
```
:vars
```

### LLM Dialog History

View the complete LLM conversation history:
```
:show __llm_dialog__
```

This is particularly useful when using execute mode to see the full context the LLM has.

### Config Inspection

View current configuration:
```
:config
```

## Error Messages

Dirac provides several types of error messages:

### Parse Errors
Invalid XML syntax or structure errors.

### Validation Errors
Tag or attribute validation failures (with debug mode, you see the detailed validation process).

### Type Errors
Parameter type mismatches (e.g., passing string when number expected).

### Scope Errors
Undefined or unused parameters and variables (shown in deep validation).

## Tips

1. **Start with debug mode off** for cleaner output
2. **Enable debug when troubleshooting** specific issues
3. **Use :debug to toggle** without restarting
4. **Check __llm_dialog__** when LLM behavior is unexpected
5. **Review autocorrection logs** to understand what changed
6. **Validate subroutines deeply** during development with `deepValidation: true` in config

## Examples

### Debug LLM Execution
```xml
<llm execute="true">
  Create a subroutine called "greet" that takes a name parameter and echoes a greeting
</llm>
```

With debug mode on, you'll see:
- The original LLM response
- Validation of the generated subroutine
- Any autocorrections applied
- Scope validation results
- Execution output

### Debug Autocorrection
```xml
<!-- Intentional typo in tag name -->
<gret nam="World"/>
```

With autocorrect enabled and debug mode on:
```
[VALIDATE] Tag: <gret>, autocorrect: true, attributes: [ 'nam' ]
[VALIDATE] Checking similarity for 'gret' against available tags
[VALIDATE] Best match: greet with score 0.90, cutoff: 0.75
[VALIDATE] Auto-corrected from <gret> to <greet>
[VALIDATE] Unknown attribute 'nam' on <greet>
[VALIDATE] Auto-corrected (similarity): nam → name
[APPLY-CORRECTION] Tag: gret → greet
[APPLY-CORRECTION] Attributes: { nam: 'name' }
```

You'll see exactly how the typos were detected and corrected.

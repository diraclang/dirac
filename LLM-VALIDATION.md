# LLM Tag Validation

The `<llm>` tag now supports automatic validation and correction of generated Dirac code when using `execute="true"`.

## Attributes

### Execution Mode
- `execute="true"` - Parse and execute the LLM response as Dirac code (existing feature)

### Tag Validation (New)
- `validate="true"` - Enable tag validation for LLM-generated code
- `autocorrect="true"` - Automatically correct similar tag names using semantic matching
- `max-retries="N"` - Maximum number of retry attempts if validation fails (default: 0)

## How It Works

When `validate="true"` is enabled:

1. **Parse**: LLM response is parsed as Dirac XML
2. **Validate**: Each tag is checked against available subroutines
   - Verifies tag names exist
   - Checks required parameters are present
   - Warns about unknown attributes
3. **Semantic Matching**: If a tag doesn't exist, finds the closest match using embeddings
4. **Auto-correct**: If `autocorrect="true"` and similarity >= 0.75, replaces tag with best match
5. **Retry**: If validation fails and `max-retries > 0`, sends error feedback to LLM and retries
6. **Execute**: Once validation passes, executes the (possibly corrected) code

## Examples

### Basic Validation

```xml
<dirac>
  <subroutine name="greet" param-name="string:required">
    <output>Hello, <variable name="name" />!</output>
  </subroutine>
  
  <llm execute="true" validate="true">
    Greet Alice
  </llm>
</dirac>
```

If the LLM generates `<greeting name="Alice" />` instead of `<greet name="Alice" />`, validation will fail with an error.

### With Auto-correction

```xml
<dirac>
  <subroutine name="greet" param-name="string:required">
    <output>Hello, <variable name="name" />!</output>
  </subroutine>
  
  <llm execute="true" validate="true" autocorrect="true">
    Greet Alice
  </llm>
</dirac>
```

If the LLM generates `<greeting name="Alice" />`, and `greeting` is semantically similar to `greet` (similarity >= 0.75), it will be auto-corrected to `<greet name="Alice" />`.

### With Retry

```xml
<dirac>
  <subroutine name="calculate" param-expression="string:required">
    <eval><variable name="expression" /></eval>
  </subroutine>
  
  <llm execute="true" validate="true" max-retries="3">
    Calculate 2 + 2
  </llm>
</dirac>
```

If validation fails:
1. LLM receives feedback: "Your previous response had the following errors: <compute>: Missing required parameter: expression"
2. LLM generates a new response
3. Process repeats up to 3 times until validation passes

### Combined Approach

```xml
<llm execute="true" validate="true" autocorrect="true" max-retries="2">
  Generate a greeting for Bob
</llm>
```

This combines auto-correction with retry:
- First tries to auto-correct similar tag names
- If that doesn't fix all errors, retries with LLM feedback
- Maximum 2 retry attempts

## Error Messages

Validation can detect:

- **Missing tags**: `Tag <xyz> does not exist and no similar tag was found.`
- **Similar tags**: `Tag <greeting> does not exist. Did you mean <greet>? (similarity: 0.85)`
- **Missing parameters**: `<greet>: Missing required parameter: name`
- **Unknown attributes**: `<greet>: Unknown attribute: person`

## Requirements

- Requires embedding server for semantic matching (Ollama with embeddinggemma model)
- Configure in `config.yml`:
  ```yaml
  embeddingServer:
    host: localhost
    port: 11435
  ```

## Performance Notes

- Validation adds latency due to embedding calls
- Each tag requires an embedding API call
- Consider using `validate="true"` only when necessary
- Auto-correction is faster than retries

## Best Practices

1. **Start without validation** for simple prompts
2. **Add validation** when LLM frequently generates incorrect tags
3. **Use autocorrect** for typos and similar names
4. **Use retry** for more complex validation errors
5. **Limit retries** to 2-3 to avoid excessive API calls
6. **Monitor debug output** with `DIRAC_DEBUG=1` to see validation details

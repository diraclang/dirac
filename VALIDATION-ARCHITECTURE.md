# Multi-Level Validation Architecture

## Overview

Dirac now implements a comprehensive multi-level validation system for LLM-generated code, providing increasingly sophisticated checks to ensure code correctness before execution.

## Validation Levels

### Level 1: XML Syntax Validation
**Status:** ✅ Handled by Parser
- Ensures well-formed XML structure
- Checks for unclosed tags, invalid characters
- Catches basic structural errors
- **Handled by:** `DiracParser` class

### Level 2: Tag & Attribute Validation
**Status:** ✅ Implemented
- Validates tag names exist (native or user-defined subroutines)
- Checks required/optional parameters
- Semantic similarity-based autocorrection for typos
- **Handles:**
  - Unknown tags → suggests similar tags using embedding similarity
  - Unknown attributes → auto-corrects to similar parameter names
  - Missing required parameters
  - Special cases: `param-*` and `meta-*` wildcards on `<subroutine>` tags
- **Implemented in:** `tag-validator.ts::validateTag()`

### Level 3: Type Validation
**Status:** ✅ Implemented
- Validates parameter values match expected types
- **Supported types:**
  - `boolean`: accepts `true`, `false`, or empty string
  - `number`/`integer`: validates numeric values
  - `string`: always valid
- **Implemented in:** `tag-validator.ts::validateParameterType()`

### Level 4: Deep Nested Validation
**Status:** ✅ Implemented
- Recursively validates all nested tags within subroutine definitions
- When LLM generates a `<subroutine>`, validates all child tags inside
- Ensures entire subroutine call chain is valid
- **Implemented in:** `tag-validator.ts::validateNestedTags()`

### Level 5: Scope & Data Flow Validation
**Status:** 🔄 Planned (Future Enhancement)
- Validate variables referenced exist in scope
- Check data flow consistency
- Ensure proper variable initialization
- Validate return values and assignments

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM Generated Code                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Level 1: XML Syntax Validation (Parser)                    │
│  ✅ Well-formed XML, closed tags, valid structure           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Level 2: Tag & Attribute Validation                        │
│  ✅ Tag exists, autocorrect typos, check parameters         │
│  - Embedding-based similarity matching (0.75 threshold)     │
│  - Special handling for param-*/meta-* wildcards            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Level 3: Type Validation                                   │
│  ✅ Parameter types match (boolean/number/string)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Level 4: Deep Nested Validation                            │
│  ✅ Recursively validate all child tags in subroutines      │
│  - Validate entire call chain                               │
│  - Ensure internal consistency                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Level 5: Scope & Data Flow (Future)                        │
│  🔄 Variable scope, initialization, return values           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Execution                               │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Validation
```typescript
const { validateDiracCode } = await import('./utils/tag-validator.js');
const validation = await validateDiracCode(session, ast);
// Returns: { valid, results, errorMessages, typeErrors }
```

### With Autocorrection
```typescript
const validation = await validateDiracCode(session, ast, { 
  autocorrect: true 
});
```

### With Deep Validation
```typescript
const validation = await validateDiracCode(session, ast, { 
  autocorrect: true,
  deepValidation: true  // Validates nested tags in subroutines
});
```

### Applying Corrections
```typescript
if (validation.results.some(r => r.corrected)) {
  const correctedAST = applyCorrectedTags(ast, validation.results);
  // Use correctedAST for execution
}
```

## Configuration Flags

### In `<llm>` tag:
- `validate="true"` - Enable validation
- `autocorrect="true"` - Enable autocorrection
- `confirm-corrections="true"` - Require LLM confirmation before executing corrections

### In code:
```typescript
{
  autocorrect: boolean;           // Auto-fix typos
  similarityCutoff: number;       // Default: 0.75
  deepValidation: boolean;        // Validate nested tags
}
```

## Validation Result Structure

```typescript
interface ValidationResult {
  valid: boolean;                               // Overall validity
  tagName: string;                              // Corrected tag name
  originalTag: string;                          // Original tag name
  corrected: boolean;                           // Was correction applied?
  errors: string[];                             // Blocking errors
  warnings: string[];                           // Non-blocking warnings
  similarity?: number;                          // Similarity score (0-1)
  attributeCorrections?: { [old: string]: string }; // Attribute name corrections
  typeErrors?: string[];                        // Type validation errors
  nestedValidation?: ValidationResult[];        // Deep validation results
}
```

## Example Validation Flow

### Input (LLM-generated):
```xml
<subroutine name="list-files" param-path="string">
  <output>Files in directory:</output>
  <ls pth="${param-path}" />
</subroutine>
```

### Validation Results:

**Level 1:** ✅ XML valid
**Level 2:** ⚠️ Unknown attribute `pth` on `<ls>`
- Autocorrect: `pth` → `path` (similarity: 0.95)
**Level 3:** ✅ Type valid (`param-path` is string)
**Level 4:** ⚠️ Nested tag `<ls>` has corrected attribute
- Applied correction: `path="${param-path}"`

### Corrected Output:
```xml
<subroutine name="list-files" param-path="string">
  <output>Files in directory:</output>
  <ls path="${param-path}" />
</subroutine>
```

## Benefits

1. **Catch errors before execution** - No runtime failures from typos
2. **Better LLM training** - Corrections feed back into training data
3. **Progressive validation** - Each level builds on previous checks
4. **Type safety** - Ensure parameter types match expectations
5. **Deep consistency** - Validate entire subroutine call chains
6. **Automatic repair** - Similarity-based autocorrection reduces friction

## Future Enhancements

### Level 5: Scope & Data Flow Validation
- Track variable declarations and usage
- Ensure variables are initialized before use
- Validate variable visibility (local/global)
- Check return value consistency

### Additional Features
- **Performance optimization**: Cache embedding results
- **Custom validators**: Allow user-defined validation rules
- **Validation reports**: Generate detailed HTML/JSON reports
- **IDE integration**: Real-time validation in editors
- **Training feedback loop**: Auto-generate correction examples for model fine-tuning

## Related Files

- `src/utils/tag-validator.ts` - Core validation logic
- `src/tags/llm.ts` - LLM integration with validation
- `lib/native-tags.di` - Native tag definitions
- `lib/ai.di` - AI assistant with validation flags

## Configuration

### Embedding Server (config.yml)
```yaml
embeddingServer:
  host: localhost
  port: 11434
  model: embeddinggemma
```

### Similarity Threshold
Default: 0.75 (75% similarity required for autocorrection)
Adjustable via `similarityCutoff` parameter

## Commit History

- Added param-*/meta-* wildcard handling for subroutine tags
- Implemented type validation for parameters
- Added deep nested tag validation
- Enabled deep validation in LLM execution flow

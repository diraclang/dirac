# Dirac Library Ecosystem

## Philosophy

Dirac follows the UNIX philosophy: **composition over complexity**. Complex operations should be implemented as reusable libraries that users can import and use with clean, declarative syntax.

## Library Architecture

### Pattern: JavaScript → Dirac Tags

1. **Implement complexity in `<eval>`** - Use JavaScript's full power for complex algorithms
2. **Wrap in `<subroutine>`** - Expose as a clean Dirac tag
3. **Distribute as `.di` files** - Share via `<import>`
4. **Use like built-in tags** - `<SQRT n="16"/>` not `eval(...)`

### Example: Square Root

**Implementation** (in library):
```xml
<subroutine name="SQRT">
  <eval>
    const caller = getParams();
    const n = parseFloat(caller.attributes.n || 0);
    let x = n, prev;
    do {
      prev = x;
      x = (x + n / x) / 2;
    } while (Math.abs(x - prev) &lt; 1e-10);
    console.log(x);
  </eval>
</subroutine>
```

**Usage** (by end user):
```xml
<import src="./lib/advanced-math.di"/>
<SQRT n="16"/>  <!-- Clean, declarative -->
```

## Current Libraries

### `lib/math.di` - Basic Math
- `SQUARE` - Square a number
- `ADD` - Add two numbers  
- `FACTORIAL` - Calculate factorial

### `lib/fileops.di` - File Operations
- `LIST_FILES` - List directory contents
- `COUNT_FILES` - Count files in directory

### `lib/advanced-math.di` - Advanced Math
- `SQRT` - Square root (Newton's method)
- `FACTORIAL` - Factorial (recursive)
- `GCD` - Greatest common divisor
- `PRIME` - Primality test
- `STATS` - Statistical analysis
- `RANDOM` - Random number generation

## Publishing Libraries

### Option 1: GitHub
```bash
# Create a dirac-libs repository
mkdir dirac-libs
cd dirac-libs
git init
# Add your .di library files
git add lib/
git commit -m "Add math libraries"
git push
```

Users import via URL or local clone.

### Option 2: npm Package
```json
{
  "name": "dirac-stdlib",
  "version": "1.0.0",
  "description": "Standard library for Dirac",
  "main": "index.js",
  "files": ["lib/**/*.di"],
  "keywords": ["dirac", "mask", "xml", "dsl"]
}
```

Users:
```bash
npm install dirac-stdlib
```

```xml
<import src="./node_modules/dirac-stdlib/lib/math.di"/>
```

### Option 3: Central Registry
Future: Create a Dirac package registry like PyPI/npm specifically for `.di` libraries.

## Best Practices

### 1. Use XML Entities for Operators
```xml
<eval>
  if (x &lt; 5) ...   <!-- Use &lt; not < -->
  if (x &gt; 10) ...  <!-- Use &gt; not > -->
  if (x &lt;= 5) ...  <!-- Use &lt;= -->
</eval>
```

### 2. Use getParams() for Attributes
```xml
<subroutine name="FOO">
  <eval>
    const caller = getParams();
    const x = caller.attributes.x;
    const children = caller.children;
  </eval>
</subroutine>
```

### 3. Handle Edge Cases
```javascript
const n = parseFloat(caller.attributes.n || 0);
if (n < 0) { console.log('NaN'); return; }
```

### 4. Document Your Library
```xml
<!-- 
  SQRT - Square Root Calculator
  
  Usage: <SQRT n="16"/>
  Returns: Square root using Newton's method
  Attributes:
    - n: Number to find square root of (required)
-->
<subroutine name="SQRT">
  ...
</subroutine>
```

## Future Libraries

Ideas for community-contributed libraries:

- **dirac-crypto** - Hashing, encryption (`<SHA256>`, `<AES>`)
- **dirac-http** - HTTP client (`<GET>`, `<POST>`)
- **dirac-db** - Database operations (`<SQL>`, `<QUERY>`)
- **dirac-ml** - Machine learning (`<PREDICT>`, `<TRAIN>`)
- **dirac-dsp** - Signal processing (`<FFT>`, `<FILTER>`)
- **dirac-viz** - Data visualization (`<CHART>`, `<PLOT>`)
- **dirac-nlp** - Natural language (`<TOKENIZE>`, `<SENTIMENT>`)

## Contributing

To contribute a library:

1. Create `.di` file with subroutines
2. Test thoroughly
3. Document all tags
4. Submit PR or publish to npm
5. Add to Dirac wiki/registry

## Philosophy: Why This Works

This approach follows McCarthy's insight about homoiconicity:
- **Code as data**: Subroutines are XML, same as the code using them
- **Composition**: Complex tags built from simple ones
- **Distribution**: Libraries are just more Dirac files
- **No special cases**: `<SQRT>` works exactly like `<output>`

The entire ecosystem grows organically through composition, not by modifying the interpreter.

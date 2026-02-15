# dirac-http (Example Library)

> **Note**: This is a **minimal skeleton library** used for documentation and examples only.
> 
> For actual HTTP functionality, use **[dirac-remote](https://github.com/diraclang/dirac-remote)** which provides:
> - Full HTTP client operations (`<HTTP_GET>`, `<HTTP_POST>`, etc.)
> - RPC support for location-transparent DIRAC execution
> - Proper error handling and response parsing

## Purpose

This directory serves as a reference example in:
- `NAMESPACES.md` - Demonstrates import syntax and namespace patterns
- `LIBRARIES.md` - Shows how to structure a DIRAC library
- `README.md` - Examples of library documentation

## Example Structure

```
dirac-http/
  lib/
    index.di          # Main library file
  examples/
    demo.di           # Usage example
  README.md           # This file
```

## Creating Your Own Library

Use this as a template for creating DIRAC libraries:

1. **Library file** (`lib/index.di`):
   ```xml
   <dirac>
     <subroutine name="YOUR_TAG">
       <!-- Implementation -->
     </subroutine>
   </dirac>
   ```

2. **Example file** (`examples/demo.di`):
   ```xml
   <dirac>
     <import src="../lib/index.di"/>
     <YOUR_TAG/>
   </dirac>
   ```

3. **Package for npm** (see dirac-stdlib, dirac-mongodb for complete examples)

## See Also

- [dirac-stdlib](https://github.com/diraclang/dirac-stdlib) - Standard library (math, strings)
- [dirac-mongodb](https://github.com/diraclang/dirac-mongodb) - MongoDB operations
- [dirac-remote](https://github.com/diraclang/dirac-remote) - HTTP/RPC functionality

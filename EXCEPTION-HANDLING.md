# Exception Handling in Dirac

Dirac implements exception handling using `<try>`, `<catch>`, `<throw>`, and `<exception>` tags, based on the MASK C implementation.

## Tags

### `<throw>`
Throws an exception that can be caught by a matching `<catch>` block.

**Attributes:**
- `name` (optional): The exception name. Defaults to "exception" if not specified.

**Example:**
```xml
<throw name="myerror">
  <output>Error message here</output>
</throw>
```

### `<try>`
Establishes an exception boundary. Exceptions thrown within a `<try>` block can be caught by subsequent `<catch>` blocks.

**Example:**
```xml
<try>
  <output>Code that might throw</output>
  <throw name="error1">
    <output>Something went wrong</output>
  </throw>
</try>
```

### `<catch>`
Catches exceptions with a matching name that were thrown in the preceding `<try>` block.

**Attributes:**
- `name` (optional): The exception name to catch. Defaults to "exception" if not specified.

**Example:**
```xml
<catch name="error1">
  <output>Handling the error: </output>
  <exception/>
</catch>
```

### `<exception>`
Outputs the content of caught exceptions. Must be used inside a `<catch>` block.

**Example:**
```xml
<catch name="myerror">
  <output>Error details: </output>
  <exception/>
</catch>
```

## How It Works

1. **Exception Stack**: All thrown exceptions are added to a global exception stack
2. **Boundaries**: `<try>` blocks create boundaries in the exception stack
3. **Name Matching**: `<catch>` blocks look for exceptions with matching names between the current position and the last boundary
4. **Multiple Catches**: Multiple exceptions with the same name can be caught together

## Examples

### Basic Usage
```xml
<try>
  <throw name="error">
    <output>An error occurred</output>
  </throw>
</try>

<catch name="error">
  <output>Caught: </output>
  <exception/>
</catch>
```

### Multiple Exception Types
```xml
<try>
  <throw name="warning">
    <output>Warning: low memory</output>
  </throw>
  <throw name="error">
    <output>Error: file not found</output>
  </throw>
</try>

<catch name="warning">
  <output>Warnings: </output>
  <exception/>
</catch>

<catch name="error">
  <output>Errors: </output>
  <exception/>
</catch>
```

### With Variables
```xml
<defvar name="errorCode" value="404"/>

<try>
  <throw name="httperror">
    <output>HTTP Error </output>
    <variable name="errorCode"/>
  </throw>
</try>

<catch name="httperror">
  <exception/>
</catch>
```

### Nested Try/Catch
```xml
<try>
  <output>Outer try</output>
  <try>
    <throw name="inner">
      <output>Inner exception</output>
    </throw>
  </try>
  <catch name="inner">
    <output>Caught in inner: </output>
    <exception/>
  </catch>
</try>
```

### Default Exception Name
Both throw and catch default to "exception" if no name is specified:

```xml
<try>
  <throw>
    <output>Default exception</output>
  </throw>
</try>

<catch>
  <exception/>
</catch>
```

## Implementation Notes

- Based on the MASK C implementation (`exception.c`, `mask_integrate.c`)
- Exceptions use a boundary-based scoping system
- Multiple exceptions with the same name can be caught together
- Exception content is stored as DOM elements
- The `<exception>` tag outputs all caught exceptions with the matching name

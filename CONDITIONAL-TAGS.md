# Conditional Tags in Dirac

Dirac supports two styles of conditional execution:

## 1. C-Style `<if>` Tag (Based on C MASK)

The `<if>` tag uses child elements for structure, following the C MASK pattern.

### Syntax

```xml
<if>
  <cond eval="eq|ne|lt|gt|le|ge">
    <arg>value1</arg>
    <arg>value2</arg>
  </cond>
  <then>
    <!-- executed if condition is true -->
  </then>
  <else>
    <!-- executed if condition is false (optional) -->
  </else>
</if>
```

### Supported Comparison Types

- `eq`, `equal`, `same` - Equality comparison
- `ne`, `notequal`, `different` - Not equal
- `lt`, `less` - Less than (numeric)
- `le`, `lessequal` - Less than or equal (numeric)
- `gt`, `greater` - Greater than (numeric)
- `ge`, `greaterequal` - Greater than or equal (numeric)

### Alternative Syntax

You can use `<do>` instead of `<then>`.

You can omit the `<cond>` wrapper and use any element as the predicate:

```xml
<if>
  <variable name="x"/>
  <then>
    <output>x exists and is truthy</output>
  </then>
</if>
```

### Examples

```xml
<!-- Simple equality -->
<defvar name="x" value="5"/>
<if>
  <cond eval="eq">
    <arg><variable name="x"/></arg>
    <arg>5</arg>
  </cond>
  <then>
    <output>x equals 5</output>
  </then>
  <else>
    <output>x does not equal 5</output>
  </else>
</if>

<!-- Greater than -->
<defvar name="age" value="25"/>
<if>
  <cond eval="gt">
    <arg><variable name="age"/></arg>
    <arg>18</arg>
  </cond>
  <then>
    <output>Adult</output>
  </then>
  <else>
    <output>Minor</output>
  </else>
</if>

<!-- Simple predicate -->
<defvar name="name" value="Alice"/>
<if>
  <variable name="name"/>
  <then>
    <output>Name is: <variable name="name"/></output>
  </then>
</if>
```

## 2. Attribute-Based `<test-if>` Tag (Original Dirac Style)

The `<test-if>` tag uses attributes for conditions, providing a more compact syntax.

### Syntax

```xml
<test-if test="$variable" [eq|ne|lt|gt|le|ge]="value">
  <!-- executed if condition is true -->
</test-if>
```

### Supported Attributes

- `test` (required) - The value or variable to test (use `$` prefix for variables)
- `eq` - Equals comparison
- `ne` - Not equals comparison
- `lt` - Less than (numeric)
- `gt` - Greater than (numeric)
- `le` - Less than or equal (numeric)
- `ge` - Greater than or equal (numeric)

If no comparison attribute is provided, the test value is evaluated as a boolean (non-empty = true).

### Examples

```xml
<!-- Simple boolean test -->
<defvar name="x" value="5"/>
<test-if test="$x">
  <output>x is truthy</output>
</test-if>

<!-- Equality test -->
<defvar name="status" value="active"/>
<test-if test="$status" eq="active">
  <output>Status is active</output>
</test-if>

<!-- Greater than test -->
<defvar name="age" value="25"/>
<test-if test="$age" gt="18">
  <output>Age is greater than 18</output>
</test-if>

<!-- Less than or equal -->
<defvar name="price" value="50"/>
<test-if test="$price" le="50">
  <output>Price is affordable</output>
</test-if>
```

## Choosing Between `<if>` and `<test-if>`

- Use **`<if>`** when:
  - You need an else clause
  - You're porting code from C MASK
  - You prefer explicit structure
  - You need complex predicates

- Use **`<test-if>`** when:
  - You only need a then clause (no else)
  - You want compact, attribute-based syntax
  - You're doing simple comparisons
  - You prefer the original Dirac style

## Truthiness Evaluation

Both tags evaluate values as follows:

- **False**: Empty string, "0", "false"
- **True**: "1", "true", any non-empty string
- For numeric comparisons, values are parsed as floats

## Notes

- Condition evaluation does not produce output (intermediate values are captured and removed)
- Arguments in `<cond>` are evaluated and their outputs captured
- Variable substitution in `<test-if>` uses `$varname` or `${varname}` syntax
- Both tags support nested content including `<defvar>`, `<output>`, and other tags

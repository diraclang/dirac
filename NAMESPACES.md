# Tag Namespace Conflict Resolution

## The Problem

```xml
<!-- Both dirac-http and dirac-rest define GET -->
<import src="./node_modules/dirac-http/lib/index.di"/>
<import src="./node_modules/dirac-rest/lib/index.di"/>

<GET url="..."/>  <!-- Which GET? Conflict! -->
```

## Solution Options

### Option 1: Library Prefixes (Convention)

Libraries use consistent prefixes:

```xml
<!-- dirac-http uses HTTP_ prefix -->
<subroutine name="HTTP_GET">...</subroutine>
<subroutine name="HTTP_POST">...</subroutine>

<!-- dirac-db uses DB_ prefix -->
<subroutine name="DB_QUERY">...</subroutine>
<subroutine name="DB_INSERT">...</subroutine>
```

**Pros:**
- Simple, works today
- No interpreter changes needed
- Clear ownership: `HTTP_GET`, `DB_QUERY`
- Searchable: "HTTP_*" shows all HTTP functions

**Cons:**
- Verbose: `<HTTP_GET/>` vs `<GET/>`
- Convention-based (not enforced)

**Recommendation: Use this NOW** ✅

### Option 2: Import Aliases (Future Feature)

```xml
<!-- Import with alias -->
<import src="./node_modules/dirac-http/lib/index.di" as="http"/>
<import src="./node_modules/dirac-rest/lib/index.di" as="rest"/>

<!-- Use with alias -->
<http:GET url="..."/>
<rest:GET endpoint="..."/>
```

**Pros:**
- Clean syntax
- Explicit disambiguation
- User controls naming

**Cons:**
- Requires interpreter changes
- XML namespace complexity

### Option 3: Scoped Imports (Future Feature)

```xml
<!-- Import specific tags -->
<import src="dirac-http" names="GET as HTTP_GET, POST as HTTP_POST"/>
<import src="dirac-rest" names="GET as REST_GET"/>

<HTTP_GET url="..."/>
<REST_GET endpoint="..."/>
```

**Pros:**
- Explicit control
- No unused tags loaded
- User-defined aliases

**Cons:**
- Verbose import statements
- Requires interpreter support

### Option 4: Implicit Namespacing (Future Feature)

```xml
<import src="dirac-http" scope="http"/>

<!-- Tags automatically prefixed in scope -->
<http>
  <GET url="..."/>    <!-- Resolves to http:GET -->
  <POST url="..."/>   <!-- Resolves to http:POST -->
</http>
```

**Pros:**
- Clean usage
- Scoped context

**Cons:**
- Complex to implement
- Unusual XML pattern

### Option 5: Last Import Wins (Simple)

```xml
<import src="dirac-http/lib/index.di"/>
<import src="dirac-rest/lib/index.di"/>

<GET url="..."/>  <!-- Uses dirac-rest's GET (last imported) -->
```

**Pros:**
- No changes needed
- Works today

**Cons:**
- Unpredictable behavior
- Hidden conflicts
- Debugging nightmare

❌ **Not recommended**

## Recommended Approach

### Phase 1: Convention (Now)

**Establish naming conventions:**

```
Library Prefix Convention:
- dirac-http    → HTTP_*     (HTTP_GET, HTTP_POST)
- dirac-db      → DB_*       (DB_QUERY, DB_CONNECT)
- dirac-crypto  → CRYPTO_*   (CRYPTO_SHA256, CRYPTO_AES)
- dirac-string  → STR_*      (STR_UPPER, STR_LOWER)
- dirac-math    → MATH_*     (MATH_SQRT, MATH_SIN)
- dirac-json    → JSON_*     (JSON_PARSE, JSON_STRINGIFY)
- dirac-xml     → XML_*      (XML_PARSE, XML_QUERY)
```

**Document in COMMUNITY.md:**
```markdown
## Naming Convention

All library tags MUST use a prefix based on the library name:

- Package name: `dirac-[domain]`
- Tag prefix: `[DOMAIN]_`
- Example: `dirac-http` → `HTTP_GET`, `HTTP_POST`

This prevents naming conflicts between libraries.
```

**Enforce in template:**
```xml
<!-- lib/index.di -->
<dirac>

<!-- Replace MYLIB with your library name (uppercase) -->
<subroutine name="MYLIB_FUNCTION1">
  ...
</subroutine>

<subroutine name="MYLIB_FUNCTION2">
  ...
</subroutine>

</dirac>
```

### Phase 2: Import Aliases (Future)

Add `as` attribute to `<import>`:

```xml
<import src="./node_modules/dirac-http/lib/index.di" as="http"/>

<!-- Interpreter translates http:GET to HTTP_GET internally -->
<http:GET url="..."/>
```

**Implementation:**
1. Parse `as` attribute in import tag
2. Store alias → library mapping in session
3. When resolving tags, check if tag contains `:`
4. If yes, look up alias and resolve to prefixed name
5. Fall back to direct name if no alias

### Phase 3: Module System (Later)

Full module system with explicit imports:

```xml
<module>
  <import from="dirac-http">
    <use name="GET" as="fetch"/>
    <use name="POST"/>
  </import>
  
  <import from="dirac-db">
    <use name="QUERY"/>
  </import>
</module>

<fetch url="..."/>        <!-- dirac-http's GET -->
<POST url="..."/>         <!-- dirac-http's POST -->
<QUERY sql="..."/>        <!-- dirac-db's QUERY -->
```

## Conflict Detection Tool

Create a tool to check for conflicts:

```bash
dirac check-conflicts

# Output:
# Warning: Tag 'GET' defined in multiple libraries:
#   - dirac-http (HTTP_GET)
#   - dirac-rest (REST_GET)
# Recommendation: Use prefixed names
```

## Real-World Examples

### Example 1: HTTP + Database

```xml
<import src="dirac-http"/>
<import src="dirac-db"/>

<!-- Clear ownership with prefixes -->
<HTTP_GET url="https://api.example.com/users"/>
<DB_INSERT table="users" data="..."/>
```

### Example 2: Multiple String Libraries

```xml
<import src="dirac-string"/>
<import src="dirac-regex"/>

<!-- No conflict -->
<STR_UPPER text="hello"/>
<REGEX_MATCH pattern="[0-9]+" text="abc123"/>
```

### Example 3: Conflict Scenario (BAD)

```xml
<!-- Both define PARSE -->
<import src="dirac-json"/>
<import src="dirac-xml"/>

<PARSE data="..."/>  <!-- Which one? -->
```

**Solution:**
```xml
<import src="dirac-json"/>
<import src="dirac-xml"/>

<JSON_PARSE data='{"key":"value"}'/>
<XML_PARSE data="<root>...</root>"/>
```

## Standard Library Naming

Core Dirac tags (built-in) have no prefix:
- `<output>` - Built-in
- `<eval>` - Built-in
- `<if>` - Built-in
- `<loop>` - Built-in

All library tags MUST have prefixes:
- `<HTTP_GET>` - From dirac-http
- `<DB_QUERY>` - From dirac-db

This makes it clear what's built-in vs library.

## Migration Path

For libraries already published without prefixes:

1. **Deprecation warning:**
```xml
<subroutine name="GET">
  <output>⚠️  Warning: GET is deprecated. Use HTTP_GET instead.</output>
  <!-- ... actual implementation ... -->
</subroutine>
```

2. **Alias old names:**
```xml
<!-- New prefixed name -->
<subroutine name="HTTP_GET">
  ...
</subroutine>

<!-- Old name calls new name -->
<subroutine name="GET">
  <HTTP_GET>
    <parameters select="*"/>
  </HTTP_GET>
</subroutine>
```

3. **Semver major version:**
- v1.x.x: `GET` (old, no prefix)
- v2.0.0: `HTTP_GET` (new, with prefix)
- v2.0.0: `GET` marked deprecated but still works

## Validation Tool

Add to `create-library.sh`:

```bash
# Check that all subroutines use proper prefix
LIBNAME_UPPER=$(echo "$LIBNAME" | tr '[:lower:]' '[:upper:]')
echo "Remember: All tags should be prefixed with ${LIBNAME_UPPER}_"
echo "Example: ${LIBNAME_UPPER}_FUNCTION"
```

Add lint command:
```bash
dirac lint lib/index.di

# Checks:
# ✓ All subroutine names use library prefix
# ✗ Found unprefixed subroutine: GET
#   Should be: HTTP_GET
```

## Documentation

Update all docs to show prefixed names:

**Good:**
```xml
<import src="dirac-http"/>
<HTTP_GET url="https://example.com"/>
```

**Bad:**
```xml
<import src="dirac-http"/>
<GET url="https://example.com"/>  <!-- Don't do this! -->
```

## Summary

**Now (Phase 1):**
- ✅ Use prefix convention: `LIBNAME_FUNCTION`
- ✅ Document in community guidelines
- ✅ Update library template
- ✅ Update all examples

**Later (Phase 2):**
- Add `as` attribute to imports
- Support `prefix:TAG` syntax
- Backward compatible

**Future (Phase 3):**
- Full module system
- Explicit named imports
- Conflict detection tools

This gives us a working solution today while leaving room for syntactic sugar later.

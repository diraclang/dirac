# DIRAC Lang - TODO

## 🔴 High Priority

### Pending
- [ ] **JSON path operations**: Implement `<json>` tag with path syntax
  - **Why**: Replace verbose `<eval>JSON.parse(...)</eval>` patterns with declarative syntax
  - **Syntax**: `<json path="a.b.c"><variable name="jsonVar" /></json>`
  - **Operations**: Get nested values, set values, array indexing
  - **Examples**: 
    - Get: `<json path="user.name"><variable name="data" /></json>`
    - Array: `<json path="items[0].title"><variable name="data" /></json>`
    - Set: `<json path="user.age" value="25"><variable name="data" /></json>`
  - **Use case**: PACKAGE_FINDING mock test currently uses messy `JSON.parse(packages)[i]`
  - **Related**: dirac-json package, array operations
  - **File**: New tag `src/tags/json.ts` or in dirac-json library

- [ ] **CLI `-c` option**: Execute inline DIRAC code from command line
  - **Why**: Quick testing, one-liners, scripting without creating files
  - **Syntax**: `dirac -c '<dirac><output>Hello</output></dirac>'`
  - **Use case**: Testing snippets, CI/CD scripts, shell integration
  - **File**: `src/cli.ts`
  - **Related**: Testing, developer experience

- [ ] **Type coercion system**: Implement proper type declaration and coercion for parameters
  - **Why**: XML attributes are always strings; need automatic conversion to prevent "1"+"2"="12"
  - Currently all XML attributes come in as strings
  - Need `Number()` wrapper in every math operation
  - Consider: automatic coercion based on `param-x="number"` declaration
  - Alternative: explicit `<cast>` tag or type attribute

## 🟡 Medium Priority

### Pending
- [ ] **Nested subroutine registration order**: Fix execution order in subroutine body
  - **Why**: Nested `<subroutine>` definitions must be registered BEFORE other statements execute
  - **Current behavior**: Subroutine body executes children sequentially - nested subroutines register when encountered
  - **Problem**: If `<parameters select="*" />` comes before nested `<subroutine>` tags, it tries to call unregistered subroutines
  - **Example issue**: `<subroutine name="array"><parameters select="*" /><subroutine name="push">...</subroutine></subroutine>`
  - **Workaround**: Place `<parameters select="*" />` AFTER all nested subroutine definitions
  - **Proper fix**: Pre-scan subroutine body and register all nested `<subroutine>` tags first, then execute other statements
  - **Location**: `src/tags/call.ts` - `executeCallInternal()` or `integrateChildren()`
  - **Impact**: Affects any pattern with nested subroutines (array operations, factory pattern, method objects)
  - **Related**: dirac-json array implementation, test-extend3-trouble.di pattern
  - **Note**: `session.skipSubroutineRegistration` flag exists but only for extend mechanism

- [ ] **Loop body scope**: Ensure `<loop>` creates proper scope for `<defvar>`
  - **Why**: Variables defined inside loop (like from `<array><pop/>`) need isolated scope per iteration
  - **Current state**: Loop shares session scope across iterations (no scope isolation)
  - **Problem**: `<defvar name="item">` in one iteration affects next iteration
  - **Needed for**: `<loop><defvar name="item"><array name="x"><pop/></array></defvar>...</loop>`
  - **Solution**: Add scope stack (pushScope/popScope) for loop body
  - Each iteration should: pushScope() → execute body → popScope()
  - Related: Subroutine calls likely need this too (check if they have scope isolation)
  - File: `src/tags/loop.ts`, possibly `src/runtime/session.ts` for scope stack
  - Related to: dirac-json array operations, PACKAGE_FINDING subroutine

- [ ] **Array operations in dirac-json**: Implement `<array>` subroutines
  - **Why**: Need declarative array manipulation for loops and data structures
  - **Location**: Should be in `dirac-json` package (arrays are JSON structures)
  - Structure: `<array name="varname"><pop/></array>` or subroutine calls
  - Operations needed: `<pop/>`, `<push>value</push>`, `<shift/>`, `<length/>`
  - Internal: Store as JavaScript arrays in session variables
  - Construction: `<defvar name="arr"><arg>1</arg><arg>2</arg></defvar>` or JSON string
  - Use case: Package installation loop in PACKAGE_FINDING
  - Package: dirac-json (to be created or added to existing dirac-stdlib)
  - Related: JSON.parse/stringify, object manipulation

- [ ] **Subroutine `visible` attribute**: Control scope persistence
  - **Why**: Enable factory pattern, modules, and closures in declarative XML
  - Syntax: `<subroutine name="x" visible="both|variable|subroutine">`
  - Default: variables and subroutines pop from stack after execution
  - `visible="variable"`: Variables persist in parent scope
  - `visible="subroutine"`: Nested subroutines persist (callable after parent completes)
  - `visible="both"`: Both variables and subroutines persist
  - Use cases: Factory pattern, module pattern, state management, closures
  - Implementation: Modify stack pop logic in subroutine execution
  - File: `src/tags/call.ts` (or wherever subroutine execution handles scope)

- [ ] **HTTP import support**: Dynamic code loading from URLs
  - **Why**: Enable KR systems, hot reload, and dynamic behavior without redeployment
  - Syntax: `<import src="http://server.com/lib/math.di"/>`
  - Auto-detect by protocol prefix (http://, https://)
  - Download to temp cache, then use existing import logic
  - Cache management: TTL, validation
  - Security: Optional checksum/signature verification
  - Use case: Dynamic subroutine loading, KR systems, hot reload
  - File: `src/tags/import.ts`
  - Related: dirac-remote can provide enhanced caching/security

- [ ] **`native` attribute**: Pass-through tags without interpretation
  - **Why**: Generate HTML/XML output and enable clean RPC syntax without CDATA verbosity
  - Use case: Output XML/HTML tags without calling subroutines
  - Syntax: `<div native>content</div>` → outputs `<div>content</div>` (no subroutine call)
  - Less verbose than CDATA: `<![CDATA[<div>content</div>]]>`
  - Similar to C implementation behavior
  - Related: HTML/XML generation, templating

- [ ] **⭐ Variable existence check**: Add `<defined>` tag for conditional logic
  - **Why**: Essential for conditional logic and environment variable checks
  - Use case: Check if variable/env var is defined before using
  - Syntax: `<if><defined><variable name="a"/></defined>...</if>`
  - Should work with: session variables, environment variables
  - Returns: boolean for use in `<if>` conditions
  - Related: Needs proper boolean evaluation in `<if>` tag

- [ ] **⭐ String operations library**: Create stdlib for string manipulation
  - **Why**: Core utilities needed for practical scripting; currently missing basic operations
  - High desirability for practical scripting
  - Needed operations: substring, split, join, trim, replace
  - Regex support: match, test, substitute/replace with patterns
  - Case conversion: uppercase, lowercase, titlecase
  - Search: indexOf, includes, startsWith, endsWith
  - File: `lib/string.di` or `lib/strings.di`

- [ ] **Import resolver enhancement**: Support package.json "exports" field
  - **Why**: Enable better subpath imports for modern npm packages
  - Currently only reads "main" field
  - Would enable better subpath imports (e.g., `dirac-lang/lib/math` directly)
  - File: `src/tags/import.ts`

- [ ] **Stdlib testing**: Create test suite for all stdlib modules
  - **Why**: Ensure reliability; math lib untested and has issues (string concatenation bug found)
  - math.di: ADD, SQUARE, FACTORIAL
  - advanced-math.di: MATH_SQRT, MATH_STATS, MATH_GCD, MATH_PRIME
  - fileops.di: file operations
  - mongodb.di: database operations

- [ ] **Documentation**: Write guide for creating DIRAC libraries as npm packages
  - **Why**: Enable community contributions and consistent package ecosystem
  - Cover: package.json structure, exports field, files field
  - Cover: transitive dependencies, node_modules resolution
  - Cover: dual-purpose packages (CLI + library)

## 🟢 Low Priority / Future

### Pending
- [ ] **🤔 Array mechanism**: Need discussion on approach
  - **Why**: Programmers need array operations; current <eval> approach has limitations
  - Option 1 (current): Use `<eval>` with JavaScript arrays - has limitations
  - Option 2 (preferred): Dedicated `<array name="x">` tag/class
    - Syntax: `<array name="myArray"><push>val</push></array>`
    - Operations: push, pop, get by index, length, map, filter
    - Leverage subroutine nesting (subroutines as "classes")
    - Similar to old C implementation but with modern features
  - Consider: Balance between declarative style vs JS power
  - Decision needed before implementation

- [ ] **JSON operations library**: Parse and query JSON data (→ `dirac-json` project)
  - **Why**: Data processing needs, though dirac-native RPC reduces JSON dependency
  - Mid desirability for data processing
  - Project location: `/Users/zhiwang/diraclang/dirac-json/`
  - Query syntax: `<json path="a.b.c">{"a":{"b":{"c":"value"}}}</json>` → "value"
  - Operations: parse, stringify, path query (JSONPath or dot notation)
  - See: `dirac-json/TODO.md` for detailed tasks

- [ ] **⭐ Tag/attribute validation with suggestions**: Improve error messages for typos
  - **Why**: High desirability for better DX; reduce frustration from typos
  - Currently relies on 7b embedding LLM engine
  - Want: meaningful suggestions when user types wrong tag or attribute
  - Example: "Unknown tag `<cal>`. Did you mean `<call>`?"
  - Could use: Levenshtein distance, fuzzy matching, or lightweight model
  - High desirability for better DX

## 🟢 Low Priority

### Pending
- [ ] **Rename `<eval>` to `<execute language="javascript">`**: More descriptive syntax
  - **Why**: Better clarity - `<eval>` suggests expression evaluation, but it's full JS execution
  - **Note**: `<execute>` is currently reserved for executing DIRAC scripts
  - **Current**: `<eval name="result">JavaScript code</eval>`
  - **Proposed**: Keep `<eval>` as-is since `<execute>` has different meaning
  - **Status**: Low priority - current syntax works fine
  - **Alternative**: Document that `<eval>` is for JavaScript, `<execute>` is for DIRAC

- [ ] **Separate stdlib package**: Consider moving stdlib to `@dirac/stdlib` or similar
  - **Why**: Allow independent versioning and optional dependencies
  - Would allow independent versioning
  - Users could opt-in to stdlib dependencies
  - Current approach (bundled) works but may bloat package

- [ ] **Type system**: Full type checking and validation
  - **Why**: Beyond coercion; enable compile-time safety and IDE support
  - Beyond simple coercion
  - Type inference, union types, custom types

## ✅ Completed

- [x] **Import relative path resolution** (v0.1.31)
  - Fixed import paths to resolve relative to the importing file, not the executable
  - Set `session.currentFile` in createSession() from config.filePath
  - Updated test files to use correct relative paths (../examples instead of ./examples)
  - All 57 tests passing
  - Enables proper module organization and nested imports

- [x] **Variable substitution in import src** (v0.1.31)
  - Added substituteAttribute() call in import tag for dynamic imports
  - Now supports `<import src="${varname}" />` pattern
  - Essential for PACKAGE_FINDING dynamic module loading
  - Added unit test: import-variable-substitution.test.di

- [x] **Subroutine `visible` attribute** (v0.1.31)
  - Implemented `visible="subroutine"` to keep nested subroutines after parent returns
  - Added boundary tracking in session.ts: setSubroutineBoundary(), cleanSubroutinesToBoundary()
  - Fixed available-subroutines boundary bug (subBoundary-1 is current subroutine)
  - Added 2 unit tests: visible-subroutine.test.di, visible-subroutine-cleanup.test.di
  - All 56 tests passing
  - Use case: PACKAGE_FINDING pattern where imported packages persist

- [x] **Loop count variable substitution** (v0.1.30)
  - Changed from substituteVariables() to substituteAttribute() in loop.ts
  - Now supports: `<loop count="${n}">` for dynamic iteration
  - Works with array length: `<defvar name="len"><array><length/></array></defvar><loop count="${len}">`
  - Added unit test: loop-variable-count.test.di
  - 54 tests passing

- [x] **Break tag for loop control** (v0.1.29)
  - Implemented `<break>` tag to exit loops early
  - Works with both `<loop>` and `<foreach>`
  - Supports conditional breaks with `<test-if>`
  - Added 3 unit tests: basic, conditional, nested loops
  - All 53 tests passing

- [x] **Array operations in dirac-json** (v0.1.0)
  - Published dirac-json package with nested subroutine pattern
  - Operations: push, pop, shift, unshift, get, length
  - JSON operations: parse, get, stringify
  - Non-destructive iteration with get(index)
  - In-place array mutation working correctly

- [x] **Math library type fixes** (v0.1.26)
  - Added Number() conversions to prevent string concatenation
  - SQUARE, ADD now use Number()
  - FACTORIAL uses parseInt(num, 10) with radix

- [x] **Node.js module resolution** (v0.1.24)
  - Walk up directory tree to find node_modules
  - Read package.json "main" field
  - Auto-add .di extension for relative paths

- [x] **Package exports setup** (v0.1.25)
  - Added lib/ directory with stdlib modules
  - Configured "exports" field for subpath imports
  - Added "files": ["dist/", "lib/"]

- [x] **Stdin implementation** (v0.1.23)
  - Fixed with removeAllListeners() before adding new ones
  - Promise-based with Buffer chunks
  - Unit test with mocking support (50 tests passing)

- [x] **Test runner stdin mocking** (v0.1.23)
  - Mock stdin methods: on(), resume(), removeListener(), removeAllListeners()
  - Uses setImmediate for async events

---

## Related Projects

Each project has its own detailed TODO.md:

- **dirac-remote** (`/Users/zhiwang/diraclang/dirac-remote/`)  
  RPC library for location-transparent execution. See: `dirac-remote/TODO.md`
  - 🔴 HIGH: `<http>` tag implementation (POST XML, parse response)
  - 🔴 HIGH: Requires `native` attribute support in core

- **dirac-stdlib** (`/Users/zhiwang/diraclang/dirac-stdlib/`)  
  Standard library: Math & String operations. See: `dirac-stdlib/TODO.md`
  - ✅ COMPLETED: Math library (ADD, SQUARE, FACTORIAL) with 8 tests
  - ✅ COMPLETED: String operations (SUBSTRING, REPLACE, SPLIT, JOIN, TRIM, etc.) with 16 tests
  - ✅ COMPLETED: Unit testing infrastructure (24 tests passing)
  - 🟡 MEDIUM: Advanced math operations

- **dirac-mongodb** (`/Users/zhiwang/diraclang/dirac-mongodb/`)  
  MongoDB integration library. See: `dirac-mongodb/TODO.md`
  - 🔴 HIGH: Port existing mongodb.di and add CRUD operations

- **dirac-rdbms** (`/Users/zhiwang/diraclang/dirac-rdbms/`)  
  Relational database library (PostgreSQL, MySQL, SQLite). See: `dirac-rdbms/TODO.md`
  - ✅ COMPLETED: PostgreSQL support with pgvector for semantic search
  - 🔴 HIGH: MySQL support
  - 🔴 HIGH: SQLite support

- **dirac-flow** (`/Users/zhiwang/diraclang/dirac-flow/`)  
  Observable-based orchestration with file queues. See: `dirac-flow/TODO.md`
  - 🔴 HIGH: Multiple output queues support
  - 🔴 HIGH: Error handling in queue processing

- **dirac-json** (`/Users/zhiwang/diraclang/dirac-json/`)  
  JSON parsing and query library. See: `dirac-json/TODO.md`
  - 🔴 HIGH: Path query syntax implementation

- **dirac-vision** (`/Users/zhiwang/diraclang/dirac-vision/`)  
  Video processing with DIRAC workers. See: `dirac-vision/TODO.md`
  - 🔴 HIGH: FFmpeg integration with workers
  - 🔴 HIGH: End-to-end flow testing

- **dirac-browser** (`/Users/zhiwang/diraclang/dirac-browser/`)  
  Browser-based DIRAC runtime

- **dirac-server** (`/Users/zhiwang/diraclang/dirac-server/`)  
  Server implementation (CGI-style endpoints for dirac-remote)

---

## Notes
- **Last updated**: 2026-02-14
- **Current version**: 0.1.31
- **Branch**: feature/26.1-devel

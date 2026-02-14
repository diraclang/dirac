# DIRAC Lang - TODO

## 🔴 High Priority

### Pending
- [ ] **Type coercion system**: Implement proper type declaration and coercion for parameters
  - **Why**: XML attributes are always strings; need automatic conversion to prevent "1"+"2"="12"
  - Currently all XML attributes come in as strings
  - Need `Number()` wrapper in every math operation
  - Consider: automatic coercion based on `param-x="number"` declaration
  - Alternative: explicit `<cast>` tag or type attribute

## 🟡 Medium Priority

### Pending
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
  - 🔴 HIGH: PostgreSQL support
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
- **Current version**: 0.1.26
- **Branch**: feature/26.1-devel

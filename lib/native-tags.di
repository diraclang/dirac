<!--
  Native Tag Interface for DIRAC
  
  This file provides stub definitions for all native (built-in) DIRAC tags.
  These definitions enable native tags to appear in :subs list and provide
  parameter documentation without affecting native tag execution.
  
  IMPORTANT: These are interface definitions only - actual execution is handled
  by the native tag implementations in src/tags/*.ts. The interpreter checks
  native tags first (switch statement), then subroutines (default case), so
  these definitions serve as documentation and never execute.
  
  Generated from DIRAC tag implementations.
-->

<!-- ============================================================
     VARIABLES & VALUES
     ============================================================ -->

<subroutine name="defvar"
  description="Define a new variable with optional visibility"
  param-name="string:required:Variable name"
  param-value="string:optional:Initial value (or use children/text)"
  param-visible="string:optional:Visibility flag|true|false|variable|both"
  param-literal="flag:optional:Store children as literal XML without execution"
  param-trim="string:optional:Trim whitespace from value|true|false">
</subroutine>

<subroutine name="assign"
  description="Assign new value to existing variable"
  param-name="string:required:Variable name to update"
  param-value="string:optional:New value (or use children/text)"
  param-trim="string:optional:Trim whitespace from value|true|false">
</subroutine>

<subroutine name="variable"
  description="Retrieve and output variable value"
  param-name="string:required:Variable name to retrieve">
  <!-- Use $varname in attributes or ${varname} in text for substitution -->
</subroutine>

<subroutine name="environment"
  description="Read environment variable value"
  param-name="string:required:Environment variable name">
</subroutine>

<!-- ============================================================
     OUTPUT & I/O
     ============================================================ -->

<subroutine name="output"
  description="Emit content to stdout or file"
  param-file="string:optional:File path for writing output">
  <!-- Children are executed and output captured -->
</subroutine>

<subroutine name="input"
  description="Read from stdin or file"
  param-source="string:required:Input source|stdin|file"
  param-mode="string:optional:Reading mode (default: all)|all|line"
  param-path="string:optional:File path (required when source=file)">
  <!-- Use mode="line" for line-by-line reading -->
</subroutine>

<!-- ============================================================
     CONTROL FLOW
     ============================================================ -->

<subroutine name="if"
  description="Conditional execution with cond/then/else children"
  visible="subroutine">
  <!--   <if> -->
  <!--     <cond><expr eval="eq"><arg>$x</arg><arg>5</arg></expr></cond> -->
  <!--     <then><output>x is 5</output></then> -->
  <!--     <else><output>x is not 5</output></else> -->
  <!--   </if> -->
  <!-- First child can be condition element; then/do and else are optional -->
</subroutine>

<subroutine name="test-if"
  description="Attribute-based conditional execution"
  param-test="string:required:Value or expression to test"
  param-eq="string:optional:Compare equal to value"
  param-ne="string:optional:Compare not equal to value"
  param-lt="string:optional:Compare less than (numeric)"
  param-gt="string:optional:Compare greater than (numeric)"
  param-le="string:optional:Compare less than or equal (numeric)"
  param-ge="string:optional:Compare greater than or equal (numeric)">
  <!-- Supports ==, !=, <, >, <=, >= in test expression -->
</subroutine>

<subroutine name="loop"
  description="Iterate fixed number of times"
  param-count="string:required:Number of iterations (supports variable substitution)"
  param-var="string:optional:Loop counter variable name (default: i)">
  <!-- Use with <break /> for early exit -->
  <!-- For while-loop behavior, use large count with <test-if> + <break> -->
</subroutine>

<subroutine name="foreach"
  description="Iterate over XML elements"
  param-from="string:required:XML content or variable (starts with $ or &lt;)"
  param-as="string:optional:Iterator variable name (default: item)"
  param-xpath="string:optional:XPath filter for elements">
</subroutine>

<subroutine name="break"
  description="Exit current loop or foreach iteration">
  <!-- Use with conditionals for while-loop behavior -->
</subroutine>

<!-- ============================================================
     EXPRESSIONS & EVALUATION
     ============================================================ -->

<subroutine name="expr"
  description="Arithmetic and logical operations"
  param-eval="string:required:Operation to perform"
  param-op="string:optional:Alias for eval attribute">
  <!-- Arguments provided as <arg> child elements -->
  <!-- Results output as text (1 for true, 0 for false in comparisons) -->
</subroutine>

<subroutine name="eval"
  description="Evaluate JavaScript expression with full context"
  param-name="string:optional:Variable name to store result"
  param-expr="string:optional:JavaScript code (or use text content)">
  <!-- Context includes: all DIRAC variables, fs, path, session -->
  <!-- Supports top-level await -->
  <!-- Use getParams() to access current subroutine parameters -->
</subroutine>

<!-- ============================================================
     SUBROUTINES & CALLS
     ============================================================ -->

<subroutine name="subroutine"
  description="Define reusable code block"
  param-name="string:required:Subroutine name"
  param-description="string:optional:Human-readable description"
  param-visible="string:optional:Visibility setting|subroutine|variable|both"
  param-extend="string:optional:Parent subroutine to extend"
  param-extends="string:optional:Alias for extend">
  <!--   <subroutine name="greet" param-name="string:required:Person to greet"> -->
  <!--     <output>Hello <parameters select="@name" />!</output> -->
  <!--   </subroutine> -->
  <!-- Use param-* attributes to document parameters -->
  <!-- Format: param-NAME="type:required|optional:description:example" -->
  <!-- Invoke with <call name="greet" /> or <greet /> directly -->
</subroutine>

<subroutine name="call"
  description="Invoke defined subroutine"
  param-name="string:required:Subroutine name to call"
  param-subroutine="string:optional:Alias for name attribute">
  <!-- Pass parameters as attributes or child elements -->
  <!-- Positional params: p1, p2, p3, etc. -->
</subroutine>

<subroutine name="parameters"
  description="Access parameters passed to subroutine"
  param-select="string:required:Parameter selector">
  <!-- select="*" : All child elements (returns output) -->
  <!-- select="@*" : All attributes as string -->
  <!-- select="@name" : Specific attribute (creates variable) -->
</subroutine>

<subroutine name="available-subroutines"
  description="List all registered subroutines as XML">
  <!-- Useful with <foreach> to iterate over subroutines -->
</subroutine>

<subroutine name="list-subroutines"
  description="List subroutines in specified format"
  param-format="string:optional:Output format (default: text)|text|json|xml"
  param-output="string:optional:Variable name to store result">
  <!-- xml: Same as <available-subroutines /> -->
</subroutine>

<subroutine name="save-subroutine"
  description="Save subroutine definition to disk"
  param-name="string:required:Subroutine name to save"
  param-file="string:optional:Explicit file path"
  param-path="string:optional:Directory name under ~/.dirac/lib/"
  param-format="string:optional:Output format (default: xml)|xml|braket">
  <!-- Persist subroutine definitions -->
  <!-- Shell command: :save greet [file] -->
</subroutine>

<subroutine name="subroutine-index"
  description="Search and manage subroutine knowledge base"
  param-path="string:optional:Directory to index or search"
  param-query="string:optional:Natural language search query"
  param-limit="string:optional:Maximum results to return"
  param-output="string:optional:Variable name to store results"
  param-format="string:optional:Output format|text|json">
  <!-- Requires embedding service for semantic search -->
</subroutine>

<!-- ============================================================
     CODE EXECUTION
     ============================================================ -->

<subroutine name="execute"
  description="Execute dynamically generated DIRAC code"
  param-source="string:optional:Variable containing DIRAC code">
  <!-- Strips markdown code blocks if present -->
  <!-- Useful for executing LLM-generated DIRAC code -->
</subroutine>

<subroutine name="system"
  description="Execute shell commands"
  param-background="string:optional:Run in background without waiting|true|false">
  <!-- Command built from text content or children -->
  <!-- Background mode returns immediately without waiting -->
</subroutine>

<!-- ============================================================
     FILE & MODULE MANAGEMENT
     ============================================================ -->

<subroutine name="import"
  description="Import subroutines from other DIRAC files"
  param-src="string:required:File path or package name">
  <!-- Supports ./ ../ / for paths, otherwise searches node_modules -->
  <!-- Automatically adds .di extension -->
  <!-- Package.json "main" field specifies entry point -->
</subroutine>

<subroutine name="require_module"
  description="Load Node.js module into variable"
  param-name="string:required:Module name to import"
  param-var="string:optional:Variable name to store module (defaults to name)">
  <!-- Import npm packages or built-in Node modules -->
  <!-- Module stored as variable for use in <eval> -->
</subroutine>

<!-- ============================================================
     LLM & AI
     ============================================================ -->

<subroutine name="llm"
  description="Invoke Large Language Model with validation"
  param-model="string:optional:Model name or use DEFAULT_MODEL env var"
  param-output="string:optional:Variable to store result"
  param-context="string:optional:Context variable for RAG"
  param-save-dialog="string:optional:Enable dialog persistence|true|false"
  param-execute="string:optional:Execute generated code immediately|true|false"
  param-temperature="string:optional:Sampling temperature (default: 1.0)"
  param-maxTokens="string:optional:Maximum tokens to generate (default: 4096)"
  param-noextra="string:optional:Skip extra context injection|true|false"
  param-validate="string:optional:Validate generated DIRAC tags|true|false"
  param-autocorrect="string:optional:Auto-fix validation errors|true|false"
  param-max-retries="string:optional:Validation retry attempts (default: 0)"
  param-feedback="string:optional:Enable validation feedback loop|true|false"
  param-max-iterations="string:optional:Max feedback iterations (default: 3)"
  param-replace-tick="string:optional:Replace backticks in code|true|false">
  <!-- Generate DIRAC code via LLM -->
  <!-- Supports Anthropic, OpenAI, Ollama providers -->
  <!-- save-dialog=true enables conversation persistence with 85% token savings -->
  <!-- execute=true runs generated code immediately -->
  <!-- validate/autocorrect for syntax checking and repair -->
  <!-- Generated subroutines auto-dumped to ~/.dirac/lib/TIMESTAMP/ -->
</subroutine>

<subroutine name="load-context"
  description="Load subroutine definitions as LLM context"
  param-limit="string:optional:Maximum subroutines to include"
  param-import="string:optional:Also import subroutines (default: true)|true|false"
  param-output="string:optional:Variable to store context text">
  <!-- Prepare RAG context for LLM -->
  <!-- Fetches subroutine definitions with metadata -->
  <!-- Use with context="ctx" in <llm> tag -->
  <!-- Enables knowledge-base enhanced prompts -->
</subroutine>

<!-- ============================================================
     EXCEPTION HANDLING
     ============================================================ -->

<subroutine name="try"
  description="Establish exception boundary">
  <!--   <try> -->
  <!--     <defvar name="x" value="${undefined}" /> -->
  <!--   </try> -->
  <!--   <catch name="exception"><output>Error caught</output></catch> -->
  <!-- Use with <catch> to handle errors -->
</subroutine>

<subroutine name="catch"
  description="Catch exceptions by name"
  param-name="string:optional:Exception name to catch (default: exception)">
  <!-- Catches exceptions between current position and last <try> boundary -->
</subroutine>

<subroutine name="throw"
  description="Throw named exception"
  param-name="string:optional:Exception name (default: exception)">
  <!-- Children become exception payload -->
  <!-- Caught by matching <catch> in enclosing <try> -->
</subroutine>

<subroutine name="exception"
  description="Access caught exception content"
  param-name="string:optional:Exception variable name">
</subroutine>

<!-- ============================================================
     XML & DATA MANIPULATION
     ============================================================ -->

<subroutine name="attr"
  description="Extract attribute from XML element"
  param-name="string:required:Attribute name to extract"
  param-from="string:required:Variable containing XML element">
  <!-- Used with <foreach> to access iteration item properties -->
  <!-- Element stored as variable from foreach as="varname" -->
</subroutine>

<!-- ============================================================
     SCHEDULING & BACKGROUND TASKS
     ============================================================ -->

<subroutine name="schedule"
  description="Run tasks on interval without blocking"
  param-interval="string:required:Seconds between executions"
  param-name="string:optional:Task identifier for logging">
  <!-- Task runs every N seconds -->
  <!-- Continues until shell/program exit -->
  <!-- Replaces existing task with same name -->
</subroutine>

<!-- ============================================================
     MONGODB (if dirac-mongodb package installed)
     ============================================================ -->

<subroutine name="mongodb"
  description="MongoDB database operations"
  param-connection="string:required:MongoDB connection string"
  param-database="string:required:Database name"
  param-collection="string:required:Collection name"
  param-operation="string:required:Operation to perform|insert|find|update|delete"
  param-query="string:optional:Query document (JSON)"
  param-document="string:optional:Document to insert/update (JSON)"
  param-output="string:optional:Variable to store results">
  <!-- Query and document parameters use JSON format -->
</subroutine>

<!-- ============================================================
     DEBUGGING & TESTING
     ============================================================ -->

<subroutine name="tag-check"
  description="Validate tag name availability">
  <!-- Used during subroutine validation -->
</subroutine>

<!-- ============================================================
     USAGE NOTES
     ============================================================
     
     VARIABLE SUBSTITUTION:
     - In attributes: Use $varname or ${varname}
     - In text: Use ${varname}
     - Example: <output>Hello $name, result is ${result}</output>
     
     PARAMETER DOCUMENTATION:
     - Use param-* attributes to document subroutine parameters
     - Format: param-NAME="type:required|optional:description:example"
     - Types: string, number, boolean, flag, any
     - Enum: param-NAME="type:required:desc:example:opt1|opt2|opt3"
     
     NATIVE VS. SUBROUTINE EXECUTION:
     - Interpreter checks native tags FIRST (switch statement)
     - Then checks user-defined subroutines (getSubroutine)
     - These interface definitions never execute - documentation only
     
     LOADING THIS FILE:
     - Import in shell init: <import src="~/.dirac/lib/native-tags.di" />
     - Or load on demand: <import src="path/to/native-tags.di" />
     - Native tags will appear in :subs list with documentation
     
     EXTENDING:
     - Add new native tags to src/tags/ directory
     - Update this file with stub definition
     - Follow param-* convention for parameter docs
     
     ============================================================ -->

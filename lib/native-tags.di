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
  meta-hide-from-llm="true"
  description="Define a new variable with optional visibility"
  param-name="string:required:Variable name"
  param-value="string:optional:Initial value (or use children/text)"
  param-visible="string:optional:Visibility flag|true|false|variable|both"
  param-literal="flag:optional:Store children as literal XML without execution"
  param-trim="string:optional:Trim whitespace from value|true|false">
</subroutine>

<subroutine name="assign"
  meta-hide-from-llm="true"
  description="Assign new value to existing variable"
  param-name="string:required:Variable name to update"
  param-value="string:optional:New value (or use children/text)"
  param-type="string:optional:Assignment type|cat"
  param-trim="string:optional:Trim whitespace from value|true|false">
  <!-- Use type="cat" to concatenate to existing value -->
  <!-- Example: <assign name="str" type="cat">more text</assign> -->
</subroutine>

<subroutine name="variable"
  meta-hide-from-llm="true"
  description="Retrieve and output variable value"
  param-name="string:required:Variable name to retrieve">
  <!-- Use $varname in attributes or ${varname} in text for substitution -->
</subroutine>

<subroutine name="environment"
  meta-hide-from-llm="true"
  description="Read environment variable value"
  param-name="string:required:Environment variable name">
</subroutine>

<!-- ============================================================
     OUTPUT & I/O
     ============================================================ -->

<subroutine name="output"
  meta-hide-from-llm="true"
  description="Emit content to stdout or file"
  param-file="string:optional:File path for writing output">
  <!-- Children are executed and output captured -->
</subroutine>

<subroutine name="input"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
  description="Iterate fixed number of times"
  param-count="string:required:Number of iterations (supports variable substitution)"
  param-var="string:optional:Loop counter variable name (default: i)">
  <!-- Use with <break /> for early exit -->
  <!-- For while-loop behavior, use large count with <test-if> + <break> -->
</subroutine>

<subroutine name="foreach"
  meta-hide-from-llm="true"
  description="Iterate over XML elements"
  param-from="string:required:XML content or variable (starts with $ or &lt;)"
  param-as="string:optional:Iterator variable name (default: item)"
  param-xpath="string:optional:XPath filter for elements">
</subroutine>

<subroutine name="break"
  meta-hide-from-llm="true"
  description="Exit current loop or foreach iteration">
  <!-- Use with conditionals for while-loop behavior -->
</subroutine>

<!-- ============================================================
     EXPRESSIONS & EVALUATION
     ============================================================ -->

<subroutine name="expr"
  meta-hide-from-llm="true"
  description="Arithmetic and logical operations"
  param-eval="string:required:Operation to perform"
  param-op="string:optional:Alias for eval attribute">
  <!-- Arguments provided as <arg> child elements -->
  <!-- Results output as text (1 for true, 0 for false in comparisons) -->
</subroutine>

<subroutine name="eval"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
  description="Invoke defined subroutine"
  param-name="string:required:Subroutine name to call"
  param-subroutine="string:optional:Alias for name attribute">
  <!-- Pass parameters as attributes or child elements -->
  <!-- Positional params: p1, p2, p3, etc. -->
</subroutine>

<subroutine name="parameters"
  meta-hide-from-llm="true"
  description="Access parameters passed to subroutine"
  param-select="string:required:Parameter selector">
  <!-- select="*" : All child elements (returns output) -->
  <!-- select="@*" : All attributes as string -->
  <!-- select="@name" : Specific attribute (creates variable) -->
</subroutine>

<subroutine name="available-subroutines"
  meta-hide-from-llm="true"
  description="List all registered subroutines as XML">
  <!-- Useful with <foreach> to iterate over subroutines -->
</subroutine>

<subroutine name="list-subroutines"
  meta-hide-from-llm="true"
  description="List subroutines in specified format"
  param-format="string:optional:Output format (default: text)|text|json|xml"
  param-output="string:optional:Variable name to store result">
  <!-- xml: Same as <available-subroutines /> -->
</subroutine>

<subroutine name="save-subroutine"
  meta-hide-from-llm="true"
  description="Save subroutine definition to disk"
  param-name="string:required:Subroutine name to save"
  param-file="string:optional:Explicit file path"
  param-path="string:optional:Directory name under ~/.dirac/lib/"
  param-format="string:optional:Output format (default: xml)|xml|braket">
  <!-- Saves subroutine to canonical location: ~/.dirac/lib/user/NAME.di -->
  <!-- Override with file="..." for custom path or path="..." for subdirectory -->
  <!-- Automatically indexes saved subroutine for search functionality -->
  <!-- Shell command: :save <name> [file|path] -->
  <!-- Examples: -->
  <!--   :save greet              -> ~/.dirac/lib/user/greet.di -->
  <!--   :save greet utils        -> ~/.dirac/lib/utils/greet.di -->
  <!--   :save greet ./custom.di  -> ./custom.di -->
</subroutine>

<subroutine name="edit-subroutine"
  meta-hide-from-llm="true"
  description="Edit subroutine definition in external editor"
  param-name="string:required:Subroutine name to edit"
  param-editor="string:optional:Editor command (default: $EDITOR or vi)">
  <!-- Opens subroutine in temp file with editor (blocking) -->
  <!-- After save/exit, automatically re-imports into session -->
  <!-- Changes take effect immediately but are NOT saved to disk -->
  <!-- Use save-subroutine to persist changes -->
</subroutine>

<subroutine name="subroutine-index"
  meta-hide-from-llm="true"
  description="Search and manage subroutine knowledge base"
  param-path="string:optional:Directory to index or search"
  param-query="string:optional:Natural language search query"
  param-limit="string:optional:Maximum results to return"
  param-output="string:optional:Variable name to store results"
  param-format="string:optional:Output format|text|json">
  <!-- Requires embedding service for semantic search -->
</subroutine>

<subroutine name="index-subroutines"
  meta-hide-from-llm="true"
  description="Index subroutines from files or directories for later search"
  param-path="string:required:File or directory path to index">
  <!-- Recursively scans .di files and extracts subroutine definitions -->
  <!-- Indexed subroutines can be searched with search-subroutines tag -->
  <!-- Shell auto-indexes ~/.dirac/lib/user on startup -->
</subroutine>

<subroutine name="search-subroutines"
  meta-hide-from-llm="true"
  description="Search indexed subroutines by name or description"
  param-query="string:required:Search query (name or description keywords)"
  param-limit="string:optional:Maximum results to return (default: 10)"
  param-output="string:optional:Variable name to store results"
  param-format="string:optional:Output format (default: text)|text|json|xml">
  <!-- Searches subroutines indexed via index-subroutines -->
  <!-- Shell command: :search <query> -->
  <!-- Example: <search-subroutines query="greeting" limit="5" format="text" /> -->
</subroutine>

<!-- ============================================================
     CODE EXECUTION
     ============================================================ -->

<subroutine name="execute"
  meta-hide-from-llm="true"
  description="Execute dynamically generated DIRAC code"
  param-source="string:optional:Variable containing DIRAC code">
  <!-- Strips markdown code blocks if present -->
  <!-- Useful for executing LLM-generated DIRAC code -->
</subroutine>

<subroutine name="system"
  meta-hide-from-llm="true"
  description="Execute shell commands"
  param-background="string:optional:Run in background without waiting|true|false">
  <!-- Command built from text content or children -->
  <!-- Background mode returns immediately without waiting -->
</subroutine>

<!-- ============================================================
     FILE & MODULE MANAGEMENT
     ============================================================ -->

<subroutine name="import"
  meta-hide-from-llm="true"
  description="Import subroutines from other DIRAC files"
  param-src="string:required:File path or package name">
  <!-- Supports ./ ../ / for paths, otherwise searches node_modules -->
  <!-- Automatically adds .di extension -->
  <!-- Package.json "main" field specifies entry point -->
</subroutine>

<subroutine name="require_module"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
  description="Invoke Large Language Model with validation"
  param-provider="string:optional:LLM provider for this call|anthropic|openai|ollama|custom"
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
  param-on-iteration="string:optional:Callback subroutine invoked after each iteration"
  param-replace-tick="string:optional:Replace backticks in code|true|false">
  <!-- Generate DIRAC code via LLM -->
  <!-- Supports Anthropic, OpenAI, Ollama, Custom providers -->
  <!-- provider attribute allows per-call provider switching -->
  <!-- save-dialog=true enables conversation persistence with 85% token savings -->
  <!-- execute=true runs generated code immediately -->
  <!-- validate/autocorrect for syntax checking and repair -->
  <!-- Generated subroutines auto-dumped to ~/.dirac/lib/TIMESTAMP/ -->
  <!-- on-iteration: callback for monitoring LLM feedback loops -->
  <!-- Callback has access to __llm_iteration__, __llm_max_iterations__, __llm_dialog__ -->
  <!-- Set __llm_stop_requested__="true" in callback to stop iteration early -->
</subroutine>

<subroutine name="load-context"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
  description="Establish exception boundary">
  <!--   <try> -->
  <!--     <defvar name="x" value="${undefined}" /> -->
  <!--   </try> -->
  <!--   <catch name="exception"><output>Error caught</output></catch> -->
  <!-- Use with <catch> to handle errors -->
</subroutine>

<subroutine name="catch"
  meta-hide-from-llm="true"
  description="Catch exceptions by name"
  param-name="string:optional:Exception name to catch (default: exception)">
  <!-- Catches exceptions between current position and last <try> boundary -->
</subroutine>

<subroutine name="throw"
  meta-hide-from-llm="true"
  description="Throw named exception"
  param-name="string:optional:Exception name (default: exception)">
  <!-- Children become exception payload -->
  <!-- Caught by matching <catch> in enclosing <try> -->
</subroutine>

<subroutine name="exception"
  meta-hide-from-llm="true"
  description="Access caught exception content"
  param-name="string:optional:Exception variable name">
</subroutine>

<!-- ============================================================
     XML & DATA MANIPULATION
     ============================================================ -->

<subroutine name="attr"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
  description="Run tasks on interval without blocking"
  param-interval="string:required:Seconds between executions"
  param-name="string:optional:Task identifier for logging">
  <!-- Task runs every N seconds -->
  <!-- Continues until shell/program exit -->
  <!-- Replaces existing task with same name -->
</subroutine>

<subroutine name="cron"
  meta-hide-from-llm="true"
  description="Run tasks on cron schedule without blocking"
  param-time="string:required:Cron expression (minute hour day month weekday)"
  param-name="string:optional:Job identifier for logging">
  <!-- Cron expression examples: -->
  <!-- "* * * * *"      - Every minute -->
  <!-- "0 9 * * *"      - Every day at 9 AM -->
  <!-- "*/5 * * * *"    - Every 5 minutes -->
  <!-- "0 0 * * 1"      - Every Monday at midnight -->
  <!-- "0 8-17 * * 1-5" - Every hour 8AM-5PM, Monday-Friday -->
  <!-- Task continues until shell/program exit -->
  <!-- Replaces existing job with same name -->
</subroutine>

<subroutine name="run-at"
  meta-hide-from-llm="true"
  description="Run task once at future time without blocking"
  param-time="string:required:When to execute"
  param-name="string:optional:Run identifier for logging">
  <!-- Executes task once at specified future time, then removes itself -->
  <!-- Time formats (all relative to current moment): -->
  <!--   "+30"   = 30 seconds from now -->
  <!--   "+5m"   = 5 minutes from now (300 seconds) -->
  <!--   "+2h"   = 2 hours from now (7200 seconds) -->
  <!--   "+7d"   = 7 days from now (604800 seconds) -->
  <!--   "2026-04-07T15:30:00" = Absolute ISO timestamp -->
  <!--   "1712502600000" = Unix timestamp in milliseconds -->
  <!-- Non-blocking: returns immediately after scheduling -->
  <!-- Error if time is in the past -->
  <!-- Replaces existing run with same name -->
</subroutine>

<!-- ============================================================
     MONGODB (if dirac-mongodb package installed)
     ============================================================ -->

<subroutine name="mongodb"
  meta-hide-from-llm="true"
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
  meta-hide-from-llm="true"
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

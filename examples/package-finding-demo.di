<!-- PACKAGE_FINDING subroutine for LLM-driven package discovery -->
<!-- This is the target design we're working toward -->

<subroutine name="PACKAGE_FINDING" visible="subroutine" 
            param-query="string:required:search query for packages">
  <defvar name="query"><parameters select="*" /></defvar>
  
  <!-- Search PostgreSQL vector database for relevant packages -->
  <defvar name="packages">
    <POSTGRES_VECTOR_SEARCH table="package_registry" limit="5">
      <variable name="query" />
    </POSTGRES_VECTOR_SEARCH>
  </defvar>
  
  <!-- Get length for iteration -->
  <defvar name="packageCount">
    <array name="packages"><length /></array>
  </defvar>
  
  <!-- Option A: Non-destructive iteration using index-based access -->
  <!-- Install all packages first -->
  <output>Installing packages...</output>
  <loop count="3">
    <!-- PROBLEM: count doesn't support variable substitution -->
    <!-- Would need: count="${packageCount}" but this doesn't work -->
    <!-- For now, hardcode or use literal from query result -->
    
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    
    <!-- Break if no more packages (pkg is empty/undefined) -->
    <test-if test="${pkg}" eq="">
      <break />
    </test-if>
    
    <output>  Installing: <variable name="pkg" /></output>
    <system>npm install <variable name="pkg" /></system>
  </loop>
  
  <!-- Import all packages -->
  <output>Importing packages...</output>
  <loop count="3">
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    
    <test-if test="${pkg}" eq="">
      <break />
    </test-if>
    
    <output>  Importing: <variable name="pkg" /></output>
    <import src="${pkg}" />
  </loop>
  
  <output>Package discovery complete!</output>
</subroutine>

<!-- Example usage (once POSTGRES_VECTOR_SEARCH exists) -->
<!-- <PACKAGE_FINDING>array operations</PACKAGE_FINDING> -->
<!-- Would find and install dirac-json automatically -->


<!-- ============================================ -->
<!-- CURRENT BLOCKERS TO SOLVE: -->
<!-- ============================================ -->

<!-- 1. Loop count variable substitution not supported -->
<!--    Current: <loop count="3"> (literal only) -->
<!--    Needed:  <loop count="${packageCount}"> (from variable) -->
<!--    Workaround: Hardcode max iterations + break on empty -->

<!-- 2. Missing POSTGRES_VECTOR_SEARCH subroutine -->
<!--    Need: dirac-postgres package with vector search -->
<!--    Query: SELECT name, package FROM package_registry -->
<!--           ORDER BY description_embedding <-> $1 LIMIT N -->
<!--    Returns: JSON array of package names -->

<!-- 3. PostgreSQL + pgvector infrastructure -->
<!--    Need: Database setup with package_registry table -->
<!--    Schema: id, name, package, description, params, description_embedding -->
<!--    Populate: dirac-stdlib, dirac-mongodb, dirac-json metadata -->

<!-- 4. Array operations from dirac-json -->
<!--    Status: ✅ Already implemented and published v0.1.0 -->
<!--    Operations: length, get, push, pop, shift, unshift -->

<!-- 5. Break tag for loop control -->
<!--    Status: ✅ Already implemented and published v0.1.29 -->
<!--    Usage: <test-if test="${pkg}" eq=""><break /></test-if> -->


<!-- ============================================ -->
<!-- SIMPLER TEST VERSION (without vector DB): -->
<!-- ============================================ -->

<output>

=== Testing with Mock Data ===
</output>

<import src="../../dirac-json/lib/index.di" />

<!-- Simulate packages from vector search -->
<defvar name="testPackages">["dirac-json", "dirac-mongodb"]</defvar>

<output>Found packages: <variable name="testPackages" /></output>
<output>Package count: <array name="testPackages"><length /></array></output>

<defvar name="pkgCount"><array name="testPackages"><length /></array></defvar>

<!-- Test non-destructive iteration with DYNAMIC count -->
<output>
First pass - simulating install (dynamic count):
</output>
<loop count="${pkgCount}">
  <defvar name="pkg">
    <array name="testPackages"><get index="${i}" /></array>
  </defvar>
  
  <output>  npm install <variable name="pkg" /></output>
</loop>

<output>
Second pass - simulating import (dynamic count):
</output>
<loop count="${pkgCount}">
  <defvar name="pkg">
    <array name="testPackages"><get index="${i}" /></array>
  </defvar>
  
  <output>  import <variable name="pkg" /></output>
</loop>

<output>
Array still intact: <variable name="testPackages" />
</output>

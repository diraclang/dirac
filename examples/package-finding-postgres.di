<!-- 
  PACKAGE_FINDING with PostgreSQL Vector Search
  
  This example shows the complete integration:
  1. Connect to PostgreSQL with pgvector
  2. Use POSTGRES_VECTOR_SEARCH to find relevant packages
  3. Install and import discovered packages
  4. Use the imported packages' subroutines
-->
<dirac>
  <!-- Import PostgreSQL library -->
  <import src="dirac-rdbms" />
  
  <!-- 
    PACKAGE_FINDING - Enhanced version with real PostgreSQL vector search
  -->
  <subroutine name="PACKAGE_FINDING" 
              visible="subroutine"
              param-query="string:required:search query for packages"
              description="Automatically discover, install, and import packages using semantic search">
    
    <defvar name="query"><parameters select="*" /></defvar>
    
    <output>🔍 Searching for packages matching: "<variable name="query" />"</output>
    
    <!-- Connect to package registry database -->
    <POSTGRES_CONNECT 
      database="dirac_packages"
      user="postgres"
      password="${POSTGRES_PASSWORD}"
    />
    
    <defvar name="connection"><variable name="pgConnection" /></defvar>
    
    <!-- Perform vector similarity search -->
    <POSTGRES_VECTOR_SEARCH 
      connection="${connection}"
      table="package_registry"
      query="${query}"
      limit="5"
    />
    
    <!-- Parse results to extract package names -->
    <defvar name="searchResults"><expr /></defvar>
    
    <execute language="javascript">
      const results = JSON.parse(variables.searchResults);
      const packageNames = results.map(row => row.package_name);
      return JSON.stringify(packageNames);
    </execute>
    
    <assign name="packages"><expr /></assign>
    
    <!-- Close database connection -->
    <POSTGRES_DISCONNECT connection="${connection}" />
    
    <!-- Get the count for dynamic iteration -->
    <defvar name="packageCount">
      <array name="packages"><length /></array>
    </defvar>
    
    <output>📦 Found <variable name="packageCount" /> packages</output>
    
    <!-- Phase 1: Install all packages -->
    <output>⬇️  Installing packages...</output>
    <loop count="${packageCount}">
      <defvar name="pkg">
        <array name="packages"><get index="${i}" /></array>
      </defvar>
      
      <output>   - Installing <variable name="pkg" />...</output>
      <system>npm install <variable name="pkg" /></system>
    </loop>
    
    <!-- Phase 2: Import all packages -->
    <output>📥 Importing packages...</output>
    <loop count="${packageCount}">
      <defvar name="pkg">
        <array name="packages"><get index="${i}" /></array>
      </defvar>
      
      <output>   - Importing <variable name="pkg" />...</output>
      <import src="${pkg}" />
    </loop>
    
    <output>✅ Package discovery complete! Packages are now available.</output>
  </subroutine>
  
  <!-- 
    Example usage: Natural language query triggers semantic package discovery
  -->
  <output>
=== PACKAGE_FINDING Demo ===
  </output>
  
  <!-- User asks for array and JSON operations -->
  <PACKAGE_FINDING>I need to manipulate arrays and work with JSON data</PACKAGE_FINDING>
  
  <!-- Now we can use the discovered packages' subroutines -->
  <output>
Testing discovered packages:
  </output>
  
  <!-- These would be available if dirac-json was discovered and imported -->
  <defvar name="testArray">["apple", "banana", "cherry"]</defvar>
  <output>Array length: <array name="testArray"><length /></array></output>
  
  <defvar name="testObj">{"name": "DIRAC", "version": "0.1.31"}</defvar>
  <output>JSON stringify: <json name="testObj"><stringify /></json></output>
  
</dirac>

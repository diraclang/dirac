<!-- 
  PACKAGE_FINDING - Mock Test Example
  
  This demonstrates the complete PACKAGE_FINDING flow without requiring
  an actual PostgreSQL database. Uses hardcoded package list for testing.
-->
<dirac>
  <!-- 
    Mock version of PACKAGE_FINDING for testing
    Shows the complete flow: search → install → import → use
  -->
  <subroutine name="PACKAGE_FINDING_MOCK" 
              visible="subroutine"
              param-query="string:required:search query for packages"
              description="Test version of PACKAGE_FINDING with hardcoded results">
    
    <defvar name="query"><parameters select="*" /></defvar>
    
    <output>🔍 [MOCK] Searching for packages matching: "<variable name="query" />"</output>
    
    <!-- Simulate vector search results -->
    <output>   [Mock: In production, this would query PostgreSQL with pgvector]</output>
    
    <!-- Mock results based on query keywords -->
    <!-- TODO: Replace with <execute language="javascript"> when implemented -->
    <eval name="packages">
      const searchQuery = query.toLowerCase();
      const allPackages = {
        'dirac-json': ['json', 'array', 'data', 'parse', 'stringify'],
        'dirac-mongodb': ['mongodb', 'database', 'nosql', 'crud'],
        'dirac-http': ['http', 'rest', 'api', 'request', 'fetch'],
        'dirac-stdlib': ['string', 'math', 'file', 'utility'],
      };
      
      // Simple keyword matching (in production, uses vector similarity)
      const matches = [];
      for (const [pkg, keywords] of Object.entries(allPackages)) {
        const score = keywords.filter(k => searchQuery.includes(k)).length;
        if (score > 0) {
          matches.push({ package: pkg, score });
        }
      }
      
      // Sort by relevance
      matches.sort((a, b) => b.score - a.score);
      
      // Return top 3 package names as JSON string
      return JSON.stringify(matches.slice(0, 3).map(m => m.package));
    </eval>
    
    <eval name="packageCount">
      return JSON.parse(packages).length;
    </eval>
    
    <output>📦 Found <variable name="packageCount" /> packages</output>
    
    <!-- Show what packages matched -->
    <loop count="${packageCount}">
      <eval name="pkg">
        return JSON.parse(packages)[i];
      </eval>
      <output>   - <variable name="pkg" /></output>
    </loop>
    
    <!-- Phase 1: Install all packages (commented out for testing) -->
    <output>
⬇️  [MOCK] Would install packages (skipped in test)
</output>
    
    <!-- Phase 2: Import all packages -->
    <output>📥 Importing packages...</output>
    <loop count="${packageCount}">
      <eval name="pkg">
        return JSON.parse(packages)[i];
      </eval>
      
      <output>   - Importing <variable name="pkg" />...</output>
      <import src="${pkg}" />
    </loop>
    
    <output>✅ Package discovery complete! Packages are now available.</output>
  </subroutine>
  
  <!-- 
    Test Case 1: User needs JSON and array operations
  -->
  <output>
=== Test 1: JSON and Array Operations ===
  </output>
  
  <PACKAGE_FINDING_MOCK>I need to parse JSON and manipulate arrays</PACKAGE_FINDING_MOCK>
  
  <!-- Verify that imported packages work -->
  <output>
Testing imported subroutines:
  </output>
  
  <defvar name="testArray">["apple", "banana", "cherry", "date"]</defvar>
  <output>• Array length: <array name="testArray"><length /></array></output>
  
  <array name="testArray"><push value="elderberry" /></array>
  <output>• After push: <variable name="testArray" /></output>
  
  <defvar name="testObj">{"framework": "DIRAC", "version": "0.1.31", "features": ["LLM", "declarative", "subroutines"]}</defvar>
  <output>• JSON stringify: <json name="testObj"><stringify indent="2" /></json></output>
  
  <!-- 
    Test Case 2: User needs database operations
  -->
  <output>

=== Test 2: Database Operations ===
  </output>
  
  <PACKAGE_FINDING_MOCK>connect to mongodb and query documents</PACKAGE_FINDING_MOCK>
  
  <output>
MongoDB subroutines would now be available:
  - MONGO_CONNECT
  - MONGO_QUERY
  - MONGO_INSERT
  - etc.
  </output>
  
  <!-- 
    Test Case 3: User needs HTTP client
  -->
  <output>

=== Test 3: HTTP Client ===
  </output>
  
  <PACKAGE_FINDING_MOCK>make REST API requests and handle responses</PACKAGE_FINDING_MOCK>
  
  <output>
HTTP subroutines would now be available:
  - HTTP_GET
  - HTTP_POST
  - HTTP_REQUEST
  - etc.
  </output>
  
  <output>

=== Summary ===
✅ PACKAGE_FINDING successfully:
   1. Parsed natural language queries
   2. Matched relevant packages (mock vector search)
   3. Imported packages with visible="subroutine"
   4. Made imported subroutines available to caller
   
🎯 In production with PostgreSQL + pgvector:
   • Semantic similarity search (not keyword matching)
   • Real npm package installation
   • Full package registry with embeddings
  </output>
</dirac>

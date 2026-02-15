<!-- PACKAGE_FINDING Subroutine - LLM-Driven Package Discovery -->
<!-- 
  This subroutine discovers and installs packages based on natural language queries.
  
  visible="subroutine" ensures that imported packages' subroutines persist after
  PACKAGE_FINDING completes, making them available to the caller.
-->

<subroutine name="PACKAGE_FINDING" 
            visible="subroutine"
            param-query="string:required:search query for packages"
            description="Automatically discover, install, and import packages based on search query">
  
  <!-- Get the search query from caller -->
  <defvar name="query"><parameters select="*" /></defvar>
  
  <output>🔍 Searching for packages matching: "<variable name="query" />"</output>
  
  <!-- TODO: This will come from POSTGRES_VECTOR_SEARCH in dirac-postgres package -->
  <!-- For now, simulate the result -->
  <defvar name="packages">["dirac-json", "dirac-mongodb"]</defvar>
  
  <!-- Get the count for dynamic iteration -->
  <defvar name="packageCount">
    <array name="packages"><length /></array>
  </defvar>
  
  <output>📦 Found <variable name="packageCount" /> packages</output>
  
  <!-- Phase 1: Install all packages -->
  <output>
⬇️  Installing packages...
</output>
  <loop count="${packageCount}">
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    
    <output>   - Installing <variable name="pkg" />...</output>
    <system>npm install <variable name="pkg" /></system>
  </loop>
  
  <!-- Phase 2: Import all packages -->
  <output>
📥 Importing packages...
</output>
  <loop count="${packageCount}">
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    
    <output>   - Importing <variable name="pkg" />...</output>
    <import src="${pkg}" />
  </loop>
  
  <output>✅ Package discovery complete! Packages are now available.</output>
</subroutine>

<!-- Example usage: -->
<!-- 
  <PACKAGE_FINDING>array operations</PACKAGE_FINDING>
  
  After this call:
  - dirac-json would be installed and imported
  - All its subroutines (array, json) would be available
  - LLM can discover this via visible="subroutine" attribute
-->

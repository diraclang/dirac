<!-- Test PACKAGE_FINDING with visible attribute and simulation -->

<!-- Import dirac-json for array operations -->
<import src="../../dirac-json/lib/index.di" />

<!-- Define PACKAGE_FINDING subroutine with visible="subroutine" -->
<subroutine name="PACKAGE_FINDING" 
            visible="subroutine"
            param-query="string:required:search query for packages"
            description="Automatically discover, install, and import packages based on search query">
  
  <defvar name="query"><parameters select="*" /></defvar>
  
  <output>🔍 Searching: "<variable name="query" />"</output>
  
  <!-- Simulate vector search result -->
  <defvar name="packages">["dirac-json", "dirac-mongodb"]</defvar>
  
  <defvar name="pkgCount">
    <array name="packages"><length /></array>
  </defvar>
  
  <output>📦 Found <variable name="pkgCount" /> packages</output>
  
  <!-- Install phase -->
  <output>⬇️  Installing...</output>
  <loop count="${pkgCount}">
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    <output>   npm install <variable name="pkg" /></output>
  </loop>
  
  <!-- Import phase -->
  <output>📥 Importing...</output>
  <loop count="${pkgCount}">
    <defvar name="pkg">
      <array name="packages"><get index="${i}" /></array>
    </defvar>
    <output>   import <variable name="pkg" /></output>
  </loop>
  
  <output>✅ Done!</output>
</subroutine>

<!-- Test the subroutine -->
<output>
=== Testing PACKAGE_FINDING ===
</output>

<PACKAGE_FINDING>array operations</PACKAGE_FINDING>

<output>

=== After PACKAGE_FINDING ===
</output>

<!-- Check if subroutine is visible in registry -->
<output>Available subroutines:</output>
<available-subroutines />

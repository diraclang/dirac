<?xml version="1.0" encoding="UTF-8"?>
<dirac>
  <!-- Test the new 'show' attribute on LLM tag -->
  <!-- This demonstrates boundary-based subroutine filtering -->
  
  <!-- Global subroutines (outside any boundary) -->
  <subroutine name="global-helper" description="A global helper subroutine">
    <echo>This is a global helper</echo>
  </subroutine>
  
  <subroutine name="another-global" description="Another global subroutine">
    <echo>Another global helper</echo>
  </subroutine>
  
  <!-- Create a boundary scope -->
  <subroutine name="test-boundary-scope" description="Test subroutine that creates a boundary">
    <!-- These local subroutines are inside the boundary -->
    <subroutine name="local-helper-1" description="Local helper inside boundary">
      <echo>Local helper 1</echo>
    </subroutine>
    
    <subroutine name="local-helper-2" description="Local helper inside boundary">
      <echo>Local helper 2</echo>
    </subroutine>
    
    <echo>
=== Testing LLM with show="boundary" (default) ===
This should only show local-helper-1 and local-helper-2
    </echo>
    
    <!-- This LLM call should only see the 2 local subroutines (within boundary) -->
    <LLM model="gpt-4" output="response1" noextra="true">
List all available subroutines you can see
    </LLM>
    
    <echo>Response with show=boundary: $response1</echo>
    
    <echo>
=== Testing LLM with show="all" ===
This should show all 4 subroutines (global + local)
    </echo>
    
    <!-- This LLM call should see ALL subroutines (global + local) -->
    <LLM model="gpt-4" output="response2" show="all" noextra="true">
List all available subroutines you can see
    </LLM>
    
    <echo>Response with show=all: $response2</echo>
  </subroutine>
  
  <!-- Run the test -->
  <test-boundary-scope/>
</dirac>

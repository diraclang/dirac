#!/usr/bin/env dirac
<!-- Simple MongoDB extension test -->
<dirac>

  <!-- Import the new MongoDB library from dirac-mongodb -->
  <import src="../../dirac-mongodb/lib/index.di" />

  <output>Testing MongoDB operations...</output>
  <output>================================</output>
  <output></output>

  <!-- Test COUNT -->
  <output>1. Counting documents with type.name = "Pass":</output>
  <MONGO_COUNT database="betting" collection="events">
    { "type.name": "Pass" }
  </MONGO_COUNT>
  
  <output></output>

  <!-- Test FIND with limit -->
  <output>2. Finding Pass events (limit 3):</output>
  <MONGO_FIND database="betting" collection="events" limit="3">
    { "type.name": "Pass" }
  </MONGO_FIND>

  <output></output>
  <output>✓ MongoDB tests completed!</output>

</dirac>

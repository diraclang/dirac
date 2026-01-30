#!/usr/bin/env dirac
<!-- Simple MongoDB extension test -->
<dirac>


  <!-- Import the MongoDB extension library -->
  <import src="./lib/mongodb.di" />

<!--
  <MONGODB database="betting" collection="events" action="find">{ "type.name": "Pass" }</MONGODB>
-->

  <output>Testing MongoDB count:&#10;</output>
 
  <MONGODB database="betting" collection="events" action="count">{ "type.name": "Pass" }</MONGODB>
  

</dirac>

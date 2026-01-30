#!/usr/bin/env dirac
<!-- Simple llm context test -->
<dirac>


  <!-- Import the MongoDB extension library -->
  <import src="./lib/mongodb.di" />

  <defvar name="myllmcontext" />
 
  <defvar name="mongo_output" >
  <MONGODB database="betting" collection="events" action="count">{ "type.name": "Pass" }</MONGODB>
  </defvar>

  <output>I have : <variable name="mongo_output" />: records</output>  

  <llm execute="true" context="myllmcontext"> My mongodb for database: betting, and collection events has :<variable name="mongo_output" />: records
   can you pull a few records from it, give me the command to retrieve it </llm>

  The context was used: <variable name="myllmcontext" />

  <eval name="contextString">
  return JSON.stringify(myllmcontext, null, 2);
</eval>
<output>${contextString}</output>

</dirac>

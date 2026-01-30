#!/usr/bin/env dirac
<!-- Simple llm context test -->
<dirac>


  <!-- Import the MongoDB extension library -->
  <import src="./lib/mongodb.di" />

  <defvar name="myllmcontext" />
 
  <defvar name="mongo_output" >
  <MONGODB database="betting" collection="events" action="count"  >{ }</MONGODB>
  </defvar>

  <output>I have : <variable name="mongo_output" />: records</output>  

  <llm execute="true" context="myllmcontext"> I have a mongodb, the database name is betting,\n and the collection name is events,
   can you pull 5 records from it, give me the command to retrieve it </llm>

  The context was used: <variable name="myllmcontext" />

  <eval name="contextString">
  return JSON.stringify(myllmcontext, null, 2);
</eval>
<output>${contextString}</output>

</dirac>

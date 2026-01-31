#!/usr/bin/env dirac
<!-- Simple llm context test -->
<dirac>


  <!-- Import the MongoDB extension library -->
  <import src="./lib/mongodb.di" />

  <defvar name="myllmcontext" />
 
  <defvar name="mongo_output" >
  <MONGODB database="betting" collection="events" action="count"  >{"type.name":"Pass" }</MONGODB>
  </defvar>

  <output>I have : <variable name="mongo_output" />: records</output>  

  <llm execute="true" context="myllmcontext"> I have a mongodb, the database name is betting,\n and the collection name is events,
   in the collection there is a field called type.name, can you select the records with type.name as Pass, and limit result to 5. give me the command to retrieve them </llm>

  The context was used: <variable name="myllmcontext" />

  <eval name="contextString">
  return JSON.stringify(myllmcontext, null, 2);
</eval>
<output>${contextString}</output>

</dirac>

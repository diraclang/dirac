#!/usr/bin/env dirac
<!-- Demo: Using MongoDB extension library -->
<dirac>

 
  <subroutine name="MONGODB">
    <parameters select="@database" />
    <parameters select="@collection" />
    <defvar name="body"><parameters select="*"/></defvar> 
    <!-- <defvar name="body">some body</defvar> -->
    
    <output>database is: <variable name="database" />&#10;</output>
    <output>collection is: <variable name="collection" />&#10;</output>
    <output>query is: <variable name="body" />&#10;</output> 
    <output>from dirac&#10;</output>


  </subroutine>

  
<MONGODB database="betting" collection="events" action="find">
 hi, this is a test
</MONGODB>

</dirac>

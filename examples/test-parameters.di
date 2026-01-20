#!/usr/bin/env dirac
<dirac>
  <!-- Test 1: parameters select="*" - access child elements -->
  <subroutine name="GREET">
    <output>Hello, </output>
    <parameters select="*"/>
    <output>!</output>
  </subroutine>

  <output>Test 1 - Child elements:</output>
  <GREET>
    <output>Alice</output>
  </GREET>
  <output>&#10;</output>

  <!-- Test 2: parameters select="@attr" - access specific attribute -->
  <subroutine name="SQUARE">
    <output>x=</output>
    <parameters select="@x"/>
    <output> squared = ?</output>
  </subroutine>

  <output>Test 2 - Attribute access: </output>
  <SQUARE x="5"/>
  <output>&#10;</output>

  <!-- Test 3: parameters select="@*" - access all attributes -->
  <subroutine name="SHOW_ATTRS">
    <output>Attributes: </output>
    <parameters select="@*"/>
    <output>&#10;</output>
  </subroutine>

  <output>Test 3 - All attributes:</output>
  <SHOW_ATTRS name="test" value="123" color="red"/>

  <!-- Test 4: Multiple child elements -->
  <subroutine name="LIST">
    <output>Items: </output>
    <parameters select="*"/>
    <output>&#10;</output>
  </subroutine>

  <output>Test 4 - Multiple children: </output>
  <LIST>
    <output>Apple, </output>
    <output>Banana, </output>
    <output>Orange</output>
  </LIST>
</dirac>

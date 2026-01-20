#!/usr/bin/env dirac
<dirac>
  <!-- 
    Parameters Tag Example
    
    The <parameters> tag allows subroutines to access their caller's
    children and attributes, enabling functional-style parameter passing.
    
    select="*"      - Execute all child elements of caller
    select="@attr"  - Emit specific attribute value
    select="@*"     - Emit all attributes as name="value" pairs
  -->

  <!-- Example 1: Functional wrapper with child content -->
  <subroutine name="BOLD">
    <output>&lt;b&gt;</output>
    <parameters select="*"/>
    <output>&lt;/b&gt;</output>
  </subroutine>

  <output>Example 1: </output>
  <BOLD>
    <output>Hello World</output>
  </BOLD>
  <output>&#10;</output>

  <!-- Example 2: Attribute passthrough -->
  <subroutine name="ATTR_DEMO">
    <output>a=</output>
    <parameters select="@a"/>
    <output>, b=</output>
    <parameters select="@b"/>
  </subroutine>

  <output>Example 2: </output>
  <ATTR_DEMO a="3" b="4"/>
  <output>&#10;</output>

  <!-- Example 3: Inspector showing all attributes -->
  <subroutine name="INSPECT">
    <output>Element attributes: [</output>
    <parameters select="@*"/>
    <output>]&#10;</output>
  </subroutine>

  <output>Example 3:&#10;</output>
  <INSPECT id="widget-1" type="button" enabled="true"/>

  <!-- Example 4: List formatter -->
  <subroutine name="UL">
    <output>&lt;ul&gt;&#10;</output>
    <parameters select="*"/>
    <output>&lt;/ul&gt;&#10;</output>
  </subroutine>

  <subroutine name="LI">
    <output>  &lt;li&gt;</output>
    <parameters select="*"/>
    <output>&lt;/li&gt;&#10;</output>
  </subroutine>

  <output>Example 4:&#10;</output>
  <UL>
    <LI><output>First item</output></LI>
    <LI><output>Second item</output></LI>
    <LI><output>Third item</output></LI>
  </UL>
</dirac>

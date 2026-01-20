#!/usr/bin/env dirac
<dirac>
  <!-- 
    Method 1: Using <expr> tag (clean, declarative)
  -->
  <subroutine name="ADD">
    <expr eval="plus">
      <arg><parameters select="@x"/></arg>
      <arg><parameters select="@y"/></arg>
    </expr>
  </subroutine>

  <output>Method 1 (expr tag):&#10;</output>
  <output>  1 + 2 = </output>
  <ADD x="1" y="2"/>
  <output>&#10;</output>

  <output>  5 + 7 = </output>
  <ADD x="5" y="7"/>
  <output>&#10;</output>

  <output>  100 + 200 = </output>
  <ADD x="100" y="200"/>
  <output>&#10;</output>

  <!-- 
    Method 2: Using getParams() in eval (programmatic)
  -->
  <subroutine name="MULTIPLY">
    <eval>
      const caller = getParams();
      if (caller && caller.attributes) {
        const x = parseInt(caller.attributes.x || 0);
        const y = parseInt(caller.attributes.y || 0);
        console.log(x * y);
      }
    </eval>
  </subroutine>

  <output>&#10;Method 2 (eval with getParams):&#10;</output>
  <output>3 * 4 = </output>
  <MULTIPLY x="3" y="4"/>
  <output>&#10;</output>

  <output>5 * 6 = </output>
  <MULTIPLY x="5" y="6"/>
  <output>&#10;</output>

  <!-- More expr examples -->
  <output>&#10;More operations:&#10;</output>
  <output>10 - 3 = </output>
  <expr eval="minus"><arg>10</arg><arg>3</arg></expr>
  <output>&#10;</output>
  
  <output>7 * 8 = </output>
  <expr eval="times"><arg>7</arg><arg>8</arg></expr>
  <output>&#10;</output>
  
  <output>20 / 4 = </output>
  <expr eval="divide"><arg>20</arg><arg>4</arg></expr>
  <output>&#10;</output>
  
  <output>17 mod 5 = </output>
  <expr eval="mod"><arg>17</arg><arg>5</arg></expr>
  <output>&#10;</output>
  
  <output>5 &lt; 10 = </output>
  <expr eval="lt"><arg>5</arg><arg>10</arg></expr>
  <output>&#10;</output>
  
  <output>5 &gt; 10 = </output>
  <expr eval="gt"><arg>5</arg><arg>10</arg></expr>
  <output>&#10;</output>
</dirac>

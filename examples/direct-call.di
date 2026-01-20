#!/usr/bin/env dirac
<dirac>
  <import src="./lib/math.di" />
  
  <output>Direct Tag Call Test&#10;&#10;</output>
  
  <defvar name="x" value="9" />
  <output>Using &lt;SQUARE /&gt;: </output>
  <SQUARE />
  <output>&#10;</output>
  
  <defvar name="a" value="100" />
  <defvar name="b" value="200" />
  <output>Using &lt;ADD /&gt;: </output>
  <ADD />
  <output>&#10;</output>
</dirac>

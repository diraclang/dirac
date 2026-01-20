#!/usr/bin/env dirac
<dirac>
  <import src="../lib/index.di"/>

  <output>String Library Demo&#10;&#10;</output>

  <output>1. STR_UPPERCASE: </output>
  <STR_UPPERCASE text="hello world"/>
  <output>&#10;</output>

  <output>2. STR_LOWERCASE: </output>
  <STR_LOWERCASE text="HELLO WORLD"/>
  <output>&#10;</output>

  <output>3. STR_TRIM: </output>
  <STR_TRIM text="  spaces  "/>
  <output>&#10;</output>

  <output>4. STR_SUBSTRING (0,5): </output>
  <STR_SUBSTRING text="Hello World" start="0" end="5"/>
  <output>&#10;</output>

  <output>5. STR_REPLACE: </output>
  <STR_REPLACE text="Hello World" find="World" replace="Dirac"/>
  <output>&#10;</output>

  <output>6. STR_SPLIT: </output>
  <STR_SPLIT text="apple,banana,cherry" delimiter=","/>
  <output>&#10;</output>

  <output>7. STR_LENGTH: </output>
  <STR_LENGTH text="Hello"/>
  <output>&#10;</output>
</dirac>

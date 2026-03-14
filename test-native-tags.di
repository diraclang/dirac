<!-- Test native-tags.di interface file -->

<!-- Import the native tags interface -->
 <import src="./lib/native-tags.di" /> 

<!-- List all subroutines to verify native tags appear -->
<output>
========================================
Testing native-tags.di interface
========================================

All registered subroutines (including native tags):
</output>

<list-subroutines format="text" />

<output>

========================================
Testing native tag execution
========================================

Testing that native &lt;defvar&gt; still works (not shadowed by interface):
</output>

<defvar name="testvar" value="Native execution works!" />
<output>testvar = <variable name="testvar" /></output>

<output>

Testing that native &lt;expr&gt; still works:
</output>

<defvar name="sum">
  <expr eval="plus">
    <arg>5</arg>
    <arg>3</arg>
  </expr>
</defvar>
<output>5 + 3 = <variable name="sum" /></output>


<output>

Testing that native &lt;loop&gt; still works:
</output>

<loop count="3">
  <output>  Loop iteration <variable name="i" /></output>
</loop>

<output>

========================================
SUCCESS: Native tags visible in :subs
         AND still execute correctly!
========================================
</output>

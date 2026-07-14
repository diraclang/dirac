<!-- Exported subroutine -->

<subroutine name="dirac-tutorial"
            description="Interactive tutorial on DIRAC XML syntax and core concepts">
  
  
  <output>
    Welcome to DIRAC XML Tutorial!

DIRAC is a declarative XML-based programming language. Here are the key concepts:

=== 1. VARIABLES ===
  </output>
  
  
  
  
  
  <defvar name="greeting" value="Hello World" />
  
  
  <output>
    Define: &lt;defvar name=&quot;greeting&quot; value=&quot;Hello World&quot;/&gt;
  </output>
  
  
  <output>
    Result: 
  </output>
  <variable name="greeting" />
  
  
  
  
  
  <assign name="greeting" value="Hello DIRAC!" />
  
  
  <output>
    
Assign: &lt;assign name=&quot;greeting&quot; value=&quot;Hello DIRAC!&quot;/&gt;
  </output>
  
  
  <output>
    Result: 
  </output>
  <variable name="greeting" />
  

<!--
  
  <output>
    

=== 2. CONDITIONALS ===
  </output>
  
  
  
  <defvar name="score" value="85" />
  
  
  <output>
    Score: 
  </output>
  <variable name="score" />
  
  
  
  <if>
    
    
    <cond>
      <expr eval="{score}" op="&gt;" eq="80" />
    </cond>
    
    
    <then>
      
      
      <output>
        
Excellent grade!
      </output>
      
    
    </then>
    
    
    <else>
      
      
      <output>
        
Keep studying!
      </output>
      
    
    </else>
    
  
  </if>
  
-->
  
  <output>
    

=== 3. LOOPS ===
  </output>
  
  
  
  <output>
    Count to 3:
  </output>
  
  
  <loop count="3" var="i">
    
    
    <output>
       
    </output>
    <variable name="i" />
    
  
  </loop>
  

  
  <output>
    
<!--
=== 4. SUBROUTINES ===
  </output>
  
  
  
  <output>
    Define a subroutine with parameters:
&lt;subroutine name=&quot;greet&quot; param-name=&quot;string&quot;&gt;
  &lt;output&gt;Hello, &lt;variable name=&quot;name&quot;/&gt;!&lt;/output&gt;
&lt;/subroutine&gt;

Call it: &lt;greet name=&quot;Alice&quot;/&gt;
  </output>
  

  
  
  
  <subroutine name="greet" param-name="string">
    
    
    <output>
      Hello, 
      <variable name="name" />
      !
    </output>
    
  
  </subroutine>
  
  
  
  
  
  <output>
    
Result: 
  </output>
  
  
  <greet name="Alice" />
  

  
  <output>
 -->   

<!--
=== 5. EXPRESSIONS ===
  </output>
  
  
  
  <defvar name="a" value="10" />
  
  
  <defvar name="b" value="5" />
  
  
  <output>
    a = 
  </output>
  <variable name="a" />
  <output>
    , b = 
  </output>
  <variable name="b" />
  
  
  <output>
    
a + b = 
  </output>
  <expr eval="{a} + {b}" />
  
  
  <output>
    
a &gt; b = 
  </output>
  <expr eval="{a} &gt; {b}" />
  

  
  <output>
    

=== 6. SYSTEM COMMANDS ===
  </output>
  
  
  
  <output>
    Current directory:
  </output>
  
  
  <system>
    pwd
  </system>
  

  
  <output>
    

=== 7. FILE OPERATIONS ===
  </output>
  
  
  
  <output file="test.txt">
    This is written to a file!
  </output>
  
  
  <output>
    File contents: 
  </output>
  
  
  <input source="file" path="test.txt" />
  

  
  <output>
-->
    

=== KEY SYNTAX RULES ===
• All tags must be properly closed: &lt;tag&gt;&lt;/tag&gt; or &lt;tag/&gt;
• Variable access: &lt;variable name=&quot;varname&quot;/&gt;
• Variable interpolation in attributes: value=&quot;{varname}&quot;
• Parameters in subroutines: param-PARAMNAME=&quot;type&quot;
• Boolean expressions: use &amp;lt; &amp;gt; &amp;amp; for &lt; &gt; &amp;
• Nesting: Tags can contain other tags for complex logic

Try modifying any of these examples to learn more!
  </output>
  

</subroutine>

<dirac-tutorial />

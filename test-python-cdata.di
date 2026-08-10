<defvar name="x" value="15" />
<defvar name="y" value="20" />

<output>Testing Python with CDATA (allows &lt;, &gt;, &amp;, etc.):</output>

<!-- CDATA preserves all characters including < > & " ' -->
<python result="answer">
<![CDATA[
# Now we can freely use comparison operators!
x_int = int(x)
y_int = int(y)

if x_int < y_int and x_int > 10:
    result = f"x ({x_int}) < y ({y_int}) && x > 10"
else:
    result = "condition not met"

# Can also use other special chars: & " ' <tag>
return result
]]>
</python>

<output>Result: $answer</output>

<!-- Without CDATA, you'd need to escape: &lt; &gt; &amp; -->
<output>

Note: CDATA is the standard XML way to include code with special characters.
Without it, you must escape: &amp;lt; for &lt;, &amp;gt; for &gt;, &amp;amp; for &amp;
</output>

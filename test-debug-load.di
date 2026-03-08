<doc>Debug load-context issue</doc>

<output>Debug: Load Context Issue
=============================

</output>

<!-- Define the subroutine -->
<subroutine name="set-background-color" description="Sets the background color of the display" param-color="string:required:The color name like red, blue, green">
  <output>🎨 Background set to: <variable name="color" />
</output>
</subroutine>

<!-- Index current file -->
<output>1. Indexing current file...
</output>
<index-subroutines path="." />

<!-- Show what was indexed -->
<output>
2. Registry stats:
</output>
<registry-stats />

<!-- Try exact search first -->
<output>
3. Search for exact name "set-background-color":
</output>
<search-subroutines query="set-background-color" limit="5" format="text" />

<!-- Try partial match -->
<output>
4. Search for "background":
</output>
<search-subroutines query="background" limit="5" format="text" />

<!-- Try "color" -->
<output>
5. Search for "color":
</output>
<search-subroutines query="color" limit="5" format="text" />

<!-- Now try the full query -->
<output>
6. Search for "set background color to blue":
</output>
<search-subroutines query="set background color to blue" limit="5" format="text" />

<!-- Try load-context with debug -->
<output>
7. Load context with query "set background color to blue":
</output>
<load-context query="set background color to blue" limit="5" import="false" />

<!-- Check what's in session now -->
<output>
8. Available subroutines in session:
</output>
<list-subroutines format="text" />

<output>
Done!
</output>

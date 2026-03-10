<doc>Test load-context tag with LLM integration</doc>

<output>Test: Load Context for LLM
============================

</output>

<!-- First, create a local subroutine -->
<subroutine name="set-background-color" description="Sets the background color of the display" param-color="string:required:The color name like red, blue, green">
  <output>Setting background to: <variable name="color" />
</output>
</subroutine>

<subroutine name="set-foreground-color" description="Sets the foreground text color" param-color="string:required:The color name">
  <output>Setting foreground to: <variable name="color" />
</output>
</subroutine>

<!-- Index current directory to register these subroutines -->
<output>1. Indexing current directory...
</output>
<index-subroutines path="." />

<!-- Search for color-related subroutines -->
<output>
2. Searching for 'color' subroutines:
</output>
<search-subroutines query="color" limit="5" format="text" />

<!-- Load context for a natural language query -->
<output>
3. Loading context for: "change the background to blue"
</output>
<load-context query="change the background to blue" limit="3" import="false" />

<!-- Now use LLM with noextra mode (without auto-loading context) -->
<output>
4. Testing LLM with manually loaded context:
</output>
<load-context query="set background color" limit="2" import="true" />
<output>Available subroutines after load-context:
</output>
<list-subroutines format="text" />

<output>
Done!
</output>

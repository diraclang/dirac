<doc>
Example: Using load-context with LLM for intelligent code generation

This demonstrates two approaches:
1. Manual context loading + LLM with noextra=true
2. Future: Automatic context loading inside LLM tag
</doc>

<!-- Define some test subroutines -->
<subroutine name="set-background-color" description="Sets the background color of the display" param-color="string:required:The color name like red, blue, green">
  <output>🎨 Background set to: <variable name="color" />
</output>
</subroutine>

<subroutine name="play-sound" description="Plays a sound effect" param-sound="string:required:Sound name like beep, chime, alert">
  <output>🔊 Playing sound: <variable name="sound" />
</output>
</subroutine>

<subroutine name="show-message" description="Display a message to the user" param-text="string:required:The message text">
  <output>💬 Message: <variable name="text" />
</output>
</subroutine>

<output>
===========================================
LLM with Context Loading Demo
===========================================

Step 1: Index current file
</output>
<index-subroutines path="test-load-context.di" />

<output>
Step 2: Search what's available
</output>
<search-subroutines query="background color sound" limit="5" format="text" />

<output>
-------------------------------------------
Approach 1: Manual context loading
-------------------------------------------
Query: "Make the background blue and play a beep sound"

Loading context...
</output>
<load-context query="Make the background blue and play a beep sound" limit="5" import="false" />

<output>
Now calling LLM with noextra=true (no auto subroutine injection)
Note: In production, you'd call <llm noextra="true" execute="true">...</llm>
But this requires LLM configuration.

Available subroutines after context load:
</output>
<list-subroutines format="braket" />

<output>

-------------------------------------------
Approach 2: Proposed enhancement
-------------------------------------------
In the future, the LLM tag could have:
  <llm execute="true" autoload="true">
    Make the background red and show message "Hello"
  </llm>

This would:
1. Extract intent from user prompt
2. Call load-context with the prompt as query
3. Import relevant subroutines 
4. Pass them to LLM context
5. Execute generated code

-------------------------------------------
Done!
===========================================
</output>

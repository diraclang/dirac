<doc>
Example: YouTube launcher using system commands
Demonstrates using <system> tag to open YouTube searches
</doc>

<!-- Define a subroutine to open YouTube with a search query -->
<subroutine name="play-youtube" 
            description="Search and play a video on YouTube" 
            param-title="string:required:The video title or search query">
  <!-- Build YouTube search URL with proper encoding -->
  <eval name="url">
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(context.title)
  </eval>
  
  <output>🎵 Opening YouTube: <variable name="title" />
</output>
  
  <!-- Open in default browser (macOS) -->
  <system>open <variable name="url" /></system>
</subroutine>

<!-- Test it -->
<output>
========================================
YouTube Launcher Demo
========================================

</output>

<play-youtube title="The Water is Wide" />

<output>

You can also use with LLM:
</output>

<!-- Example with LLM (requires LLM config) -->
<!-- Uncomment to test:
<output>
With LLM context loading:
</output>

<load-context>open youtube video</load-context>

<llm execute="true">
  Play "Amazing Grace" on YouTube
</llm>
-->

<output>
Done!
</output>

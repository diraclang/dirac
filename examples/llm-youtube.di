<doc>
Complete example: Using LLM with context loading to play YouTube videos
Shows the full RAG workflow
</doc>

<output>
========================================
LLM + YouTube Demo
========================================

Step 1: Index the YouTube library
</output>

<index-subroutines path="../dirac-stdlib/lib" />

<output>
Step 2: Search for video-related subroutines
</output>

<search-subroutines query="youtube video music" limit="5" format="text" />

<output>
Step 3: Load context for playing videos
</output>

<load-context>play a video on youtube</load-context>

<output>
Step 4: Show what's available
</output>

<list-subroutines format="text" />

<output>

========================================
Manual Test (without LLM)
========================================

</output>

<play-youtube title="The Water is Wide" />

<output>

========================================
With LLM (uncomment to test)
========================================

The workflow would be:
1. User says: "Play Amazing Grace on YouTube"
2. load-context searches registry for "youtube play video"
3. Finds and imports play-youtube subroutine
4. LLM gets context with available subroutines
5. LLM generates: <play-youtube title="Amazing Grace" />
6. Dirac executes and opens browser

To test with LLM:
</output>

<!-- Uncomment when LLM is configured:

<load-context>play youtube video</load-context>

<llm execute="true">
  Play "Amazing Grace" on YouTube
</llm>

-->

<output>
Done!
</output>

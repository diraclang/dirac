<doc>Test subroutine registry functionality</doc>

<output>Testing Subroutine Registry
==========================

</output>

<!-- Index the standard library -->
<output>1. Indexing dirac-stdlib...
</output>
<index-subroutines path="../dirac-stdlib" />

<!-- Show statistics -->
<output>
2. Registry Statistics:
</output>
<registry-stats />

<!-- Search for greeting-related subroutines -->
<output>
3. Searching for 'greeting' subroutines:
</output>
<search-subroutines query="greeting" limit="5" format="text" />

<!-- Search for string manipulation -->
<output>
4. Searching for 'string' subroutines:
</output>
<search-subroutines query="string" limit="5" format="text" />

<output>
Done!
</output>

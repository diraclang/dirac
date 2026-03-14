<!-- Test autocomplete in shell -->
<import src="./lib/native-tags.di" />

<defvar name="test_complete" value="Autocomplete test ready!" />

<subroutine name="list-items" description="List some items">
  <output>Item 1, Item 2, Item 3</output>
</subroutine>

<subroutine name="list-users" description="List users">
  <output>Alice, Bob, Charlie</output>
</subroutine>

<subroutine name="list-files" description="List files">
  <output>file1.txt, file2.txt, file3.txt</output>
</subroutine>

<subroutine name="load-data" description="Load data">
  <output>Data loaded</output>
</subroutine>

<output>
Autocomplete test file loaded!

Try typing in the shell and press TAB:

1. Tag name completion:
   |li[TAB]       → Suggests: list-items, list-users, list-files, list-subroutines

2. After exact tag name, shows parameters:
   |llm[TAB]      → Shows available parameters: model=string, output=string, context=string, etc.

3. Attribute name completion:
   |llm m[TAB]    → Suggests: model=, maxTokens=, max-retries=, max-iterations=
   |llm o[TAB]    → Suggests: output=, noextra=

4. Shell commands:
   :h[TAB]        → Suggests: :help, :history
   :s[TAB]        → Suggests: :save, :subs

Parameters marked with * are required!
Press TAB multiple times to cycle through suggestions!
</output>

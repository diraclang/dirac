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

Try typing in the shell:
  |li[TAB]       - Should suggest: list-items, list-users, list-files, list-subroutines
  |load[TAB]     - Should suggest: load-data, load-context
  :h[TAB]        - Should suggest: :help, :history
  :s[TAB]        - Should suggest: :save, :subs

Press TAB to see autocomplete suggestions!
</output>

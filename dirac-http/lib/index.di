<dirac>

<!-- All tags use the library prefix to avoid naming conflicts -->
<subroutine name="HTTP_EXAMPLE">
  <eval>
    const caller = getParams();
    const input = caller.attributes.input || 'no input';
    console.log('Processed: ' + input);
  </eval>
</subroutine>

</dirac>

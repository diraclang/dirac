<!-- TEST: tag_check_autocorrect -->
<!-- EXPECT: The tag <background-set> was auto-corrected to <background> (similarity: 0.84)
Color changed to: red -->

<dirac>
  <subroutine name="background" 
              description="Change the background color"
              param-color="string:required:Background color:red|blue|green">
    <parameters select="@color"/>
    <output>Color changed to: <variable name="color" /></output>
  </subroutine>

  <subroutine name="foreground"
              description="Change the foreground text color"
              param-color="string:required:Text color:black|white|gray">
    <parameters select="@color"/>
    <output>Text color changed to: <variable name="color" /></output>
  </subroutine>

  <!-- Test: tag-check should auto-correct similar tag names and execute -->
  <defvar name="result" trim="true">
    <tag-check execute="true" autocorrect="true">
      <background-set color="red" />
    </tag-check>
  </defvar>
  <output><variable name="result" /></output>
</dirac>

<dirac>

  <subroutine name="background" description="set the background color." param-color="string:required:color name" >
    <parameters select="@color"/>
    <output> 
    this is my color: <variable name="color" /> 
    </output>
  </subroutine>

  <llm execute="true">set the background color to red</llm>

  
</dirac>

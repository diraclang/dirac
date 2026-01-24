<dirac>
  <subroutine name="inventory" description="Show you the inventory" >
   you have reachded the inventory
  </subroutine>

  <subroutine name="order" description="Places an order for an item." param-item="string:required:Item name" param-quantity="number:required:Quantity">
    <parameters select="@item"/>
    <parameters select="@quantity"/>
    <output> 
    this is my item: <variable name="item" /> 
    and <variable name="quantity" />
    </output>
  </subroutine>

  <llm execute="true">Show me my inventory</llm>
  <llm execute="true">Order 2 apples</llm>

  
</dirac>

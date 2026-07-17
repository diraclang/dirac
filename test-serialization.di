<dirac>
  <!-- Test subroutine serialization without extra whitespace -->
  
  <subroutine name="greet" param-name="string:required">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Call it to load into session -->
  <greet name="World"/>
  
  <!-- Test more complex subroutine -->
  <subroutine name="complex" 
              param-name="string:required" 
              param-value="string:optional">
    <if condition="true">
      <output>
        Name: <variable name="name"/>
        <if-defined var="value">
          , Value: <variable name="value"/>
        </if-defined>
      </output>
    </if>
  </subroutine>
  
  <complex name="Test" value="123"/>
</dirac>

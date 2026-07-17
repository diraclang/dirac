<dirac>
  <!-- Test serialization by printing to output -->
  
  <subroutine name="greet" param-name="string:required">
    <output>Hello, <variable name="name"/>!</output>
  </subroutine>
  
  <!-- Call it once to demonstrate -->
  <greet name="World"/>
  
  <!-- Show the serialized subroutine -->
  <echo>
--- Subroutine 'greet' serialized ---
  </echo>
  
</dirac>

<dirac>
  <subroutine name="Person" description="Represents a person with age and gender">
    <subroutine name="age" param-value="integer:required:Age of the person">
      <output><variable name="value" /></output>
    </subroutine>
    <subroutine name="gender" param-type="string:optional:Gender M/F">
      <output><variable name="type" /></output>
    </subroutine>
    <available-subroutines />
  </subroutine>
  
  <output>Available methods for Person:</output>
  <output>
</output>
  <Person />
</dirac>

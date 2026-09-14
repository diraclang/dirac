<dirac>
<subroutine name="create-an-apple" param-name="string" visible="both">
  <output>Creating apple with name=$name</output>
  <defvar name="$name" value="{&quot;x&quot;:0}" />
  <output>Created variable $name</output>
  <subroutine name="$name" visible="both">
    <output>Called subroutine $name</output>
  </subroutine>
  <output>Registered subroutine $name</output>
</subroutine>

<output>About to create apple...</output>
<create-an-apple name="apple" />
<output>Done creating. Now calling apple...</output>
<apple />
<output>Done!</output>
</dirac>

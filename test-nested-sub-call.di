<dirac>
<subroutine name="outer" param-name="string">
  <output>In outer, name=$name</output>
  <subroutine name="$name">
    <output>In nested</output>
  </subroutine>
</subroutine>

<outer name="apple" />
<output>Calling apple</output>
<apple />
</dirac>

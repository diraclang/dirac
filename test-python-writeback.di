<dirac>
<defvar name="b" value='{"x": 10}' />

<output>Before: b = </output>
<variable name="b" />
<output>
</output>

<subroutine name="Object" param-instance="Object">
  <subroutine name="push">
    <python result="instance">
new_instance = {}
x = instance['x'] + 1
new_instance['x'] = x
print("Inside Python - new_instance:", new_instance)
return new_instance
    </python>
  </subroutine>
</subroutine>

<Object instance="b">
  <push />
</Object>

<output>After: b = </output>
<variable name="b" />
<output>
</output>
</dirac>

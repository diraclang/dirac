<dirac>
<defvar name="b" value='{"x": 10}' />

<python>
# Access the object as a dictionary
print("b['x'] =", b['x'])
print("Type of b:", type(b))
</python>

<python result="doubled">
# Modify and return
result = b['x'] * 2
return result
</python>

<output>Doubled value: $doubled</output>
</dirac>

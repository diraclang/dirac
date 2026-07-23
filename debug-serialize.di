<!-- Debug serialization issue -->

<python>
import json
sub = session.subroutines[-1]  # Get the last subroutine
print("Subroutine name:", sub['name'])
print("Element tag:", sub['element']['tag'])
print("Element children count:", len(sub['element'].get('children', [])))
if sub['element'].get('children'):
    for i, child in enumerate(sub['element']['children']):
        print(f"  Child {i}: tag={child.get('tag')}, has children={len(child.get('children', []))}")
        if child.get('children'):
            for j, grandchild in enumerate(child['children']):
                print(f"    Grandchild {j}: tag={grandchild.get('tag')}, text={grandchild.get('text', '')[:50]}")
</python>

<output>Check the children structure</output>

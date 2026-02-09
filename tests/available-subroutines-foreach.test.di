<!-- TEST: available-subroutines with foreach and attr -->
<!-- EXPECT: - show-subroutines: 
- greet: Greets someone
- gender: Returns gender identity
- age: Returns the person age -->
<dirac>
<subroutine name="TestSuite">
  <subroutine name="age" description="Returns the person age">
    <output>42</output>
  </subroutine>
  
  <subroutine name="gender" description="Returns gender identity">
    <output>Male</output>
  </subroutine>
  
  <subroutine name="greet" description="Greets someone">
    <output>Hello!</output>
  </subroutine>

  <subroutine name="show-subroutines">
    <defvar name="subs"><available-subroutines /></defvar>
    <foreach from="$subs" as="sub" xpath="//subroutine">
      <output>- <attr name="name" from="$sub" />: <attr name="description" from="$sub" />
</output>
    </foreach>
  </subroutine>

  <show-subroutines />
</subroutine>

<TestSuite />
</dirac>

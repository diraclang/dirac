<dirac>
 <subroutine name="test" param-color="string:required" >
 <output>In test: <variable name="color" /></output>
 <test2 color="$color" > I am in body: <variable name="color" /></test2>
 </subroutine>
 <subroutine name="test2" param-color="string:required" >
 <output>in subroutine 2: <variable name="color" /></output>
 <output><parameters select="*" /></output>
 </subroutine>

<defvar name="index" value="1" />


<loop count="2" var="i" >
 i:<variable name="i" />&#10;
 <if test="$i == 0" >
   <test color="red" />
</if>
<if test="$i > 0" >
   <test color="blue" />
</if>
</loop>


</dirac>
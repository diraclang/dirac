<!-- Loop and conditional test -->
<dirac>
  <defvar name="result" value="" />
  
  <loop count="5" var="i">
    <eval name="isEven" expr="i % 2 === 0" />
    
    <if test="${isEven} == true">
      <output>${i} is even&#10;</output>
    </if>
  </loop>
</dirac>

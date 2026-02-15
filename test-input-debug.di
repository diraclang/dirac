<dirac>
  <defvar name="counter" value="0" />
  
  <loop count="4">
    <defvar name="line">
      <input source="file" path="tests/test-input.txt" mode="line" />
    </defvar>
    
    <test-if test="$line != ''">
      <assign name="counter">
        <eval><variable name="counter" /> + 1</eval>
      </assign>
      <variable name="counter" />
      <output>:</output>
      <variable name="line" />
      <output>|</output>
    </test-if>
  </loop>
</dirac>

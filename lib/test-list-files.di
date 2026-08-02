<subroutine name="test-list-files"
            param-path="string">
  <defvar name="cmd" value="ls" />
  <assign name="cmd" value="ls -la " />
  <if test-if="path">
    <assign name="cmd" type="cat" value="$path" />
  </if>
  <output><variable name="cmd" /></output>
  <output>
    <system>
      <variable name="cmd" />
    </system>
  </output>
</subroutine>

<test-list-files path="~/.dirac" />

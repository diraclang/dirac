<!-- Test preserving visible attribute when saving -->

<!-- Define a factory with visible=subroutine -->
<subroutine name="test-factory" visible="subroutine">
  <subroutine name="test-inner" visible="subroutine">
    <output>Inner subroutine</output>
  </subroutine>
</subroutine>

<!-- Register it -->
<test-factory/>

<!-- Save test-inner to XML format -->
<save-subroutine name="test-inner" format="xml" file="./test-visible-output.xml"/>

<output>Saved test-inner to test-visible-output.xml</output>
<output>Check if visible="subroutine" is preserved in the XML file.</output>

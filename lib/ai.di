<!-- Exported subroutine chain -->

<subroutine name="ai"
            description="AI"
            visible="both">
  <load-context>
    <parameters select="*" />
  </load-context>
  <llm replace-tick="false" router="sys-router" execute="true" save-dialog="true" show="boundary" feedback="true" validate="true" autocorrect="true" confirm-corrections="true" max-iterations="10">
    <parameters select="*" />
    <return>
      <variable name="__llm_dialog__" />
    </return>
  </llm>
</subroutine>

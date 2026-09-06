<!-- Exported subroutine chain -->

<subroutine name="ai"
            description="AI"
            visible="both">
  <load-context>
    <parameters select="*" />
  </load-context>
  <llm execute="true" save-dialog="true" show="boundary" feedback="true" validate="true" autocorrect="true" confirm-corrections="true" router="sys-router" max-iterations="10">
    <parameters select="*" />
    <return>
      <variable name="__llm_dialog__" />
    </return>
  </llm>
</subroutine>

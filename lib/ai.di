<!-- Exported subroutine -->

<subroutine name="ai"
            description="AI assistant with context loading (internal wrapper - use llm tag directly instead)"
            visible="subroutine" >
  
  
  

   
  
  
  <load-context>
    
    
    
    
    
    
    <parameters select="*" />
    
    
    
   
  
  
  </load-context>
  
  
  

  
  
  
  <llm execute="true" save-dialog="true" show="boundary" feedback="true" validate="true" autocorrect="true" confirm-corrections="true">
    
    
    
      
    
    
    <parameters select="*" />
    
    
    
  
  
  
  </llm>
  
  
  
  
  
  
  
  
  

  




</subroutine>

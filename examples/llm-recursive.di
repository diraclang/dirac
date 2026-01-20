<!-- Recursive LLM - LLM calling Dirac calling LLM -->
<dirac>
  <!-- Define a subroutine that gets stock info -->
  <subroutine name="getStockPrice">
    <parameters>
      <variable name="symbol" passby="value" />
    </parameters>
    
    <LLM output="price" maxTokens="50">
      What is the current approximate stock price of ${symbol}? 
      Respond with just a number (e.g., "150.23").
    </LLM>
    
    <output>${symbol}: $${price}</output>
  </subroutine>
  
  <!-- LLM decides which stocks to check -->
  <LLM output="response">
    List 3 major tech stocks to check, one per line.
    Format: SYMBOL only (e.g., "AAPL")
  </LLM>
  
  <output>Checking stocks from LLM: ${response}&#10;&#10;</output>
  
  <!-- In the future, this could parse ${response} and call getStockPrice for each -->
  <call name="getStockPrice">
    <parameters>
      <variable value="AAPL" />
    </parameters>
  </call>
</dirac>

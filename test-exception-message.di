<!-- Test exception with message -->

<try>
  <output>Attempting division...</output>
  
  <throw name="DivisionError">
    <output>Error: Cannot divide by zero!</output>
    <output>Location: calculateResult() function</output>
  </throw>
  
  <output>This won't print</output>
  
  <catch name="DivisionError">
    <output>Caught DivisionError with message:</output>
    <exception />
  </catch>
</try>

<output>---</output>

<try>
  <throw name="ValidationError">
    <set name="errorCode" value="ERR_001" />
    <set name="errorMessage" value="Invalid input format" />
  </throw>
  
  <catch name="ValidationError">
    <output>Validation failed!</output>
    <output>Exception details:</output>
    <exception />
    <output>Error code: ${errorCode}</output>
    <output>Message: ${errorMessage}</output>
  </catch>
</try>

<output>Done!</output>

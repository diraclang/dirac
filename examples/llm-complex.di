<dirac>
  <!-- UI Control Services -->
  <!-- These subroutines are exposed as natural language endpoints -->

  <subroutine name="background" 
              description="Change the background color, do not generate other tags like <changeBackground /> use precise tag"
              param-color="string:required:Background color:red|blue|green|yellow|orange|purple|pink|white|black">
    <parameters select="@color"/>
              
    <eval>
      console.log('Changing background color to: ' + color);
    </eval>
  </subroutine>

  <subroutine name="set-text-size"
              description="Adjust the text size"
              param-size="string:required:Font size:12px|14px|16px|18px|20px|24px">
    <parameters select="@size" />
    <eval>
      console.log("change text size to "+size );
      document.body.style.fontSize = '${size}';
    </eval>
  </subroutine>

  <subroutine name="reset-styles"
              description="Reset all styles to default">
    <eval>
      console.log("reset all styles back");
      document.body.style.backgroundColor = 'white';
      document.body.style.fontSize = '16px';
    </eval>
  </subroutine>

  <subroutine name="text-color"
              description="Change the text color"
              param-color="string:required:Text color:black|white|red|blue|green">
   <parameters select="@color" />
    <eval>
      console.log("change color of text to "+color);
      document.body.style.color = '${color}';
    </eval>
  </subroutine>

  <!-- Event Generation Examples -->
  
  <subroutine name="click-button"
              description="Simulate clicking a button"
              param-selector="string:optional:CSS selector (default: #submit-button)">
    <eval>
      const selector = '${selector}' || '#submit-button';
      const element = document.querySelector(selector);
      if (element) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        element.dispatchEvent(clickEvent);
      } else {
        throw new Error('Element not found: ' + selector);
      }
    </eval>
  </subroutine>

  <subroutine name="type-text"
              description="Type text into an input field"
              param-text="string:required:Text to type"
              param-field="string:optional:Which field:name|email">
    <parameters select="@text" />
    <parameters select="@field" />
    <eval>
      const _field = typeof field !== 'undefined' && field ? field : 'name';
      const selector = _field === 'email' ? '#email-input' : '#name-input';
      const input = document.querySelector(selector);
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error('Input not found: ' + selector);
      }
    </eval>
  </subroutine>

  <subroutine name="check-terms"
              description="Check or uncheck the terms checkbox"
              param-checked="string:optional:Check state:true|false">
    <eval>
      const shouldCheck = '${checked}' !== 'false';
      const checkbox = document.querySelector('#terms-checkbox');
      if (checkbox) {
        checkbox.checked = shouldCheck;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error('Checkbox not found');
      }
    </eval>
  </subroutine>

  <subroutine name="clear-input"
              description="Clear an input field"
              param-field="string:optional:Which field:name|email">
    <eval>
      const field = '${field}' || 'name';
      const selector = field === 'email' ? '#email-input' : '#name-input';
      const input = document.querySelector(selector);
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error('Input not found: ' + selector);
      }
    </eval>
  </subroutine>

<!--
  <subroutine name="modify-file" 
   description="modify a file based on pattern and replacement field "
   param-filename="string|required"
   param-pattern="string|required"
   param-replace="string|required"
  >
   <parameters select="@filename" />
   <parameters select="@pattern" />
   <parameters select="@replace" />
   <system>
     sed -e 's/${pattern}/${replace}/g' ${filename} 
   </system>
  </subroutine>
  -->

 <llm noextra="true" execute="false">
  <system>
   ls -tl 
  </system>
   find me the file with name hello.di and modify the pattern of World with Zhi
   use the command <modify-file I listed to do this.
 </llm>

</dirac>

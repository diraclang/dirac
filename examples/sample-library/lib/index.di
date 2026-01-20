<dirac>

<subroutine name="STR_UPPERCASE">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    console.log(text.toUpperCase());
  </eval>
</subroutine>

<subroutine name="STR_LOWERCASE">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    console.log(text.toLowerCase());
  </eval>
</subroutine>

<subroutine name="STR_TRIM">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    console.log(text.trim());
  </eval>
</subroutine>

<subroutine name="STR_SUBSTRING">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    const start = parseInt(caller.attributes.start || 0);
    const end = caller.attributes.end ? parseInt(caller.attributes.end) : undefined;
    console.log(text.substring(start, end));
  </eval>
</subroutine>

<subroutine name="STR_REPLACE">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    const find = caller.attributes.find || '';
    const replace = caller.attributes.replace || '';
    console.log(text.replace(new RegExp(find, 'g'), replace));
  </eval>
</subroutine>

<subroutine name="STR_SPLIT">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    const delimiter = caller.attributes.delimiter || ',';
    const parts = text.split(delimiter);
    console.log(JSON.stringify(parts));
  </eval>
</subroutine>

<subroutine name="STR_LENGTH">
  <eval>
    const caller = getParams();
    const text = caller.attributes.text || '';
    console.log(text.length);
  </eval>
</subroutine>

</dirac>

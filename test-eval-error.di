<output>Testing eval with variable names containing special characters:

</output>

<defvar name="an-apple" value='{"color":"red"}' />
<defvar name="my-var" value="hyphenated" />
<defvar name="normalName" value="normal" />
<defvar name="under_score" value="underscore" />

<eval name="result">
// Variables with valid JS identifiers are available directly
console.log("1. normalName:", normalName);
console.log("2. under_score:", under_score);

// Variables with hyphens (invalid JS identifiers) accessible via vars object
console.log("3. an-apple via vars:", vars["an-apple"]);
console.log("4. my-var via vars:", vars["my-var"]);

// All variables (including special ones) are in vars
console.log("5. normalName via vars:", vars.normalName);

return "All variable access patterns work!";
</eval>

<output>Result: $result

Summary:
- Valid identifiers (normalName, under_score) → direct access
- Invalid identifiers (an-apple, my-var) → use vars["name"]
- All variables accessible via vars object
</output>

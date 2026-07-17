<!-- Test: :save-subroutine-training command -->
<dirac>
  <output>Test Save Subroutine as Training Data&#10;&#10;</output>
  
  <!-- Define a sample subroutine that could be used for training -->
  <subroutine name="greet" 
              param-name="string:required:Person's name"
              description="Greet a person by name">
    <output>Hello, <parameters select="@name" />! Welcome to Dirac.&#10;</output>
  </subroutine>
  
  <subroutine name="calculate-bmi"
              param-weight="number:required:Weight in kg"
              param-height="number:required:Height in meters"
              description="Calculate Body Mass Index">
    <eval name="bmi">
      const weight = parseFloat(getParams().attributes.weight);
      const height = parseFloat(getParams().attributes.height);
      return (weight / (height * height)).toFixed(2);
    </eval>
    <output>Your BMI is: ${bmi}&#10;</output>
  </subroutine>
  
  <subroutine name="list-files"
              param-directory="string:optional:Directory path"
              description="List files in a directory">
    <eval name="fileList">
      const dir = getParams().attributes.directory || '.';
      return fs.readdirSync(dir).slice(0, 10).join(', ');
    </eval>
    <output>Files: ${fileList}&#10;</output>
  </subroutine>
  
  <!-- List the defined subroutines -->
  <output>Defined subroutines:&#10;</output>
  <list-subroutines />
  <output>&#10;</output>
  
  <!-- Test one of them -->
  <output>Testing greet subroutine:&#10;</output>
  <greet name="Alice" />
  <output>&#10;</output>
  
  <!-- Instructions for saving as training data -->
  <output>To save a subroutine as training data, use:&#10;</output>
  <output>  :save-subroutine-training greet&#10;</output>
  <output>&#10;</output>
  <output>You will be prompted to:&#10;</output>
  <output>  1. Enter a description (what a user would ask to create this)&#10;</output>
  <output>     Example: "create a greeting subroutine that welcomes a person by name"&#10;</output>
  <output>  2. Review the training example in your editor&#10;</output>
  <output>  3. Save to a .jsonl file&#10;</output>
  <output>&#10;</output>
  <output>The format will be:&#10;</output>
  <output>  {"messages":[&#10;</output>
  <output>    {"role":"user","content":"your description"},&#10;</output>
  <output>    {"role":"assistant","content":"&lt;subroutine...&gt;"}&#10;</output>
  <output>  ]}&#10;</output>
  <output>&#10;</output>
  <output>Examples to try:&#10;</output>
  <output>  :save-subroutine-training greet&#10;</output>
  <output>  :save-subroutine-training calculate-bmi&#10;</output>
  <output>  :save-subroutine-training list-files&#10;</output>
</dirac>

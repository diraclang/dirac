<!-- Example Training Data Output -->
<!-- 
  This file shows example output from :save-subroutine-training command.
  The actual output is in JSONL format (JSON Lines).
-->

<!-- Example 1: Simple Greeting Subroutine -->
<!--
User description: "create a greeting subroutine that welcomes users by name"

Output in train.jsonl:
{"messages":[{"role":"user","content":"create a greeting subroutine that welcomes users by name"},{"role":"assistant","content":"<subroutine name=\"greet\" param-name=\"string:required:Person's name\" description=\"Greet a person by name\">\n  <output>Hello, <parameters select=\"@name\" />! Welcome to Dirac.</output>\n</subroutine>"}]}
-->

<!-- Example 2: BMI Calculator -->
<!--
User description: "create a subroutine to calculate body mass index from weight and height"

Output in train.jsonl:
{"messages":[{"role":"user","content":"create a subroutine to calculate body mass index from weight and height"},{"role":"assistant","content":"<subroutine name=\"calculate-bmi\" param-weight=\"number:required:Weight in kg\" param-height=\"number:required:Height in meters\" description=\"Calculate Body Mass Index\">\n  <eval name=\"bmi\">\n    const weight = parseFloat(getParams().attributes.weight);\n    const height = parseFloat(getParams().attributes.height);\n    return (weight / (height * height)).toFixed(2);\n  </eval>\n  <output>Your BMI is: ${bmi}</output>\n</subroutine>"}]}
-->

<!-- Example 3: File Lister -->
<!--
User description: "write a subroutine to list files in a directory"

Output in train.jsonl:
{"messages":[{"role":"user","content":"write a subroutine to list files in a directory"},{"role":"assistant","content":"<subroutine name=\"list-files\" param-directory=\"string:optional:Directory path\" description=\"List files in a directory\">\n  <eval name=\"fileList\">\n    const dir = getParams().attributes.directory || '.';\n    return fs.readdirSync(dir).slice(0, 10).join(', ');\n  </eval>\n  <output>Files: ${fileList}</output>\n</subroutine>"}]}
-->

<!-- 
USAGE WORKFLOW:

1. Create a subroutine in your Dirac session:
   <subroutine name="example">
     <output>Example content</output>
   </subroutine>

2. Save as training data:
   :save-subroutine-training example

3. Enter description when prompted:
   "create an example subroutine"

4. Review in editor (opens automatically)

5. Save to file:
   - Just filename: saves to ~/.dirac/training/filename.jsonl
   - Full path: /path/to/your/train.jsonl
   - Relative: ./training/train.jsonl

6. Training data is appended (not overwritten)

JSONL FORMAT:
- One JSON object per line
- Each line is a complete training example
- Compatible with most fine-tuning tools

BEST PRACTICES:
- Write descriptions as natural user requests
- Be specific and clear
- Review output before saving
- Organize by category (basic, advanced, domain-specific)
- Use pruned mode for LLM dialogs to remove errors
-->

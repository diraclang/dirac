<!-- File Manager Agent - Operational Example -->
<dirac>
  <defvar name="targetDir" value="examples" />
  
  <output>Analyzing directory: ${targetDir}&#10;&#10;</output>
  
  <!-- Step 1: List files in directory -->
  <output>Listing files...&#10;</output>
  <eval name="fileList">
    const files = fs.readdirSync(targetDir);
    return files.join(', ');
  </eval>
  <output>Found: ${fileList}&#10;&#10;</output>
  
  <!-- Step 2: Ask LLM to analyze what's missing -->
  <output>Asking LLM to analyze...&#10;</output>
  <LLM output="analysis" maxTokens="200">
    I have a directory with these files: ${fileList}
    
    These appear to be example files for a programming language.
    Suggest ONE simple example file that would be useful to add.
    
    Respond with ONLY:
    1. Filename (must end in .di)
    2. Brief description (one line)
    
    Format:
    FILENAME: name.di
    DESCRIPTION: what it does
  </LLM>
  <output>${analysis}&#10;&#10;</output>
  
  <!-- Step 3: Extract filename from LLM response -->
  <eval name="newFilename">
    const text = analysis;
    const match = text.match(/FILENAME:\s*(\S+\.di)/i);
    return match ? match[1] : 'new-example.di';
  </eval>
  
  <output>Creating file: ${newFilename}&#10;</output>
  
  <!-- Step 4: Ask LLM to generate the file content -->
  <LLM output="fileContent" maxTokens="300">
    Create the content for ${newFilename} based on this description:
    ${analysis}
    
    The file should use Dirac XML syntax with these tags:
    - &lt;dirac&gt; (root)
    - &lt;defvar name="x" value="y" /&gt;
    - &lt;output&gt;text&lt;/output&gt;
    - &lt;LLM output="var"&gt;prompt&lt;/LLM&gt;
    
    Make it simple and functional. Include XML declaration and comment.
  </LLM>
  
  <!-- Step 5: Write the file -->
  <eval name="writeResult">
    const filePath = path.join(targetDir, newFilename);
    const content = fileContent;
    fs.writeFileSync(filePath, content, 'utf-8');
    return 'File written successfully to ' + filePath;
  </eval>
  
  <output>&#10;Result: ${writeResult}&#10;</output>
  
  <!-- Step 6: Verify the file was created -->
  <eval name="verification">
    const filePath = path.join(targetDir, newFilename);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return 'Verified! File size: ' + stats.size + ' bytes';
    }
    return 'Error: File not found';
  </eval>
  
  <output>Verification: ${verification}&#10;</output>
</dirac>

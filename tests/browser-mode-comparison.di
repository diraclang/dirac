<dirac>
  <!-- Comparison: Literal vs Capture Mode -->
  
  <defvar name="userName" value="Bob" />
  <defvar name="userScore" value="95" />
  
  <!-- Define a subroutine that generates an HTML card -->
  <subroutine name="score-card">
    <div class="card">
      <h3>Player Score</h3>
      <p class="score"><variable name="userScore" /></p>
      <p class="name"><variable name="userName" /></p>
    </div>
  </subroutine>
  
  <!-- LITERAL MODE - Variables won't expand -->
  <output>Opening literal mode example...</output>
  <browser mode="literal" port="3210" title="Literal Mode">
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; background: #f0f0f0; }
          .card { background: white; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Literal Mode Example</h1>
        <p>This is static HTML - no DIRAC processing</p>
        <!-- This won't work - it's just literal text: -->
        <call name="score-card" />
      </body>
    </html>
  </browser>
  
  <!-- CAPTURE MODE - Variables and subroutines work -->
  <output>Opening capture mode example...</output>
  <browser mode="capture" port="3211" title="Capture Mode">
    <html>
      <head>
        <style>
          body { 
            font-family: Arial; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          }
          h1 { color: #333; }
          .card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            margin: 20px 0;
          }
          .score { 
            font-size: 3em; 
            font-weight: bold;
            margin: 10px 0;
          }
          .name {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .note {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Capture Mode Example</h1>
          <p>This HTML is generated dynamically by DIRAC!</p>
          
          <!-- This WILL work - subroutine is executed and HTML is generated -->
          <call name="score-card" />
          
          <div class="note">
            <strong>✨ Dynamic Features:</strong><br />
            • Variables expanded: userName = <variable name="userName" /><br />
            • Score displayed: <variable name="userScore" /><br />
            • Subroutine executed to generate card<br />
            • All composed together with capture mode
          </div>
        </div>
      </body>
    </html>
  </browser>
  
  <output>✨ Both examples opened!</output>
  <output>Compare:</output>
  <output>  - Literal mode (port 3210): Static HTML only</output>
  <output>  - Capture mode (port 3211): Dynamic DIRAC content</output>
</dirac>

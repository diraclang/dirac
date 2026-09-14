<dirac>
  <output>Opening browser with interactive demo...</output>
  
  <!-- Example 1: Simple HTML -->
  <browser title="Hello DIRAC" auto-close="true">
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            text-align: center;
          }
          h1 {
            font-size: 3em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .button {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            font-size: 1em;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 Hello from DIRAC!</h1>
          <p>This HTML was rendered by the &lt;browser&gt; tag</p>
          <button class="button" onclick="alert('DIRAC is awesome!')">
            Click Me!
          </button>
        </div>
      </body>
    </html>
  </browser>
  
  <output>Browser opened successfully!</output>
  
  <!-- Example 2: Dynamic content with variables -->
  <defvar name="username" value="DIRAC User" />
  <defvar name="timestamp" value="2026-08-02" />
  
  <!-- Note: To use variables in HTML, you'd need to pre-process the HTML content -->
  <!-- This is a simpler example with inline content -->
  
</dirac>

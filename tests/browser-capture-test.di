<dirac>
  <!-- Test browser capture mode with dynamic HTML generation -->
  <output>Testing browser capture mode...</output>
  
  <!-- Define some data -->
  <defvar name="pageTitle" value="Sales Dashboard" />
  <defvar name="userName" value="Alice" />
  <defvar name="userRole" value="Manager" />
  
  <!-- Define a subroutine that generates HTML -->
  <subroutine name="generate-stats">
    <div class="stats">
      <div class="stat-card">
        <h3>Total Sales</h3>
        <p class="value">$125,000</p>
      </div>
      <div class="stat-card">
        <h3>New Customers</h3>
        <p class="value">247</p>
      </div>
      <div class="stat-card">
        <h3>Growth</h3>
        <p class="value">+23%</p>
      </div>
    </div>
  </subroutine>
  
  <!-- Define a subroutine to generate table rows -->
  <subroutine name="generate-table-rows">
    <tr>
      <td>Product A</td>
      <td>$15,000</td>
      <td>+5%</td>
    </tr>
    <tr>
      <td>Product B</td>
      <td>$23,500</td>
      <td>+12%</td>
    </tr>
    <tr>
      <td>Product C</td>
      <td>$18,200</td>
      <td>-3%</td>
    </tr>
  </subroutine>
  
  <!-- Use capture mode to generate dynamic HTML -->
  <browser mode="capture" title="Capture Mode Test" port="3200">
    <html>
      <head>
        <meta charset="UTF-8" />
        <title><variable name="pageTitle" /></title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          }
          header {
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #333;
            margin: 0 0 10px 0;
          }
          .user-info {
            color: #666;
            font-size: 0.9em;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
          }
          .stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            opacity: 0.9;
          }
          .stat-card .value {
            margin: 0;
            font-size: 2em;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          th {
            background: #f5f5f5;
            font-weight: 600;
            color: #333;
          }
          tr:hover {
            background: #f9f9f9;
          }
          .generated-note {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
            font-size: 0.9em;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><variable name="pageTitle" /></h1>
            <div class="user-info">
              Welcome, <variable name="userName" /> (<variable name="userRole" />)
            </div>
          </header>
          
          <h2>Key Metrics</h2>
          <call name="generate-stats" />
          
          <h2>Product Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Revenue</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <call name="generate-table-rows" />
            </tbody>
          </table>
          
          <div class="generated-note">
            <strong>🎯 This page was generated dynamically using DIRAC!</strong><br />
            - Variables were substituted inline<br />
            - Subroutines generated HTML fragments<br />
            - All composed together in capture mode
          </div>
        </div>
      </body>
    </html>
  </browser>
  
  <output>✨ Dashboard opened at http://localhost:3200</output>
  <output>🎯 Using capture mode with dynamic variables and subroutines!</output>
</dirac>

<dirac>
  <!-- Simple graph example - just a quick start -->
  <browser title="Quick Graph" port="3101">
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #333; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Simple Line Chart</h1>
          <canvas id="myChart"></canvas>
        </div>
        
        <script>
          new Chart(document.getElementById('myChart'), {
            type: 'line',
            data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                label: 'Website Visitors',
                data: [120, 190, 150, 250, 220, 300, 280],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: {
                  display: true,
                  text: 'Weekly Traffic'
                }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
        </script>
      </body>
    </html>
  </browser>
</dirac>

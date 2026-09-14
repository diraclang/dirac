<dirac>
  <output>Opening interactive graph demo...</output>
  
  <browser title="DIRAC Graph Demo" keep-open="true" port="3100">
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DIRAC Graph Demo</title>
        
        <!-- Chart.js from CDN -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
          }
          
          .container {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
          }
          
          h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .chart-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }
          
          .chart-card:hover {
            transform: translateY(-5px);
          }
          
          .chart-title {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
          }
          
          .chart-container {
            position: relative;
            height: 300px;
          }
          
          .controls {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
            color: white;
          }
          
          button {
            background: white;
            color: #667eea;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            margin-right: 10px;
            margin-top: 10px;
            transition: all 0.3s;
          }
          
          button:hover {
            background: #667eea;
            color: white;
            transform: scale(1.05);
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          
          .stat-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .stat-label {
            opacity: 0.9;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>📊 DIRAC Graph Demo</h1>
            <p class="subtitle">Interactive charts powered by Chart.js</p>
          </header>
          
          <div class="grid">
            <!-- Line Chart -->
            <div class="chart-card">
              <div class="chart-title">📈 Sales Trend</div>
              <div class="chart-container">
                <canvas id="lineChart"></canvas>
              </div>
            </div>
            
            <!-- Bar Chart -->
            <div class="chart-card">
              <div class="chart-title">📊 Monthly Revenue</div>
              <div class="chart-container">
                <canvas id="barChart"></canvas>
              </div>
            </div>
            
            <!-- Pie Chart -->
            <div class="chart-card">
              <div class="chart-title">🥧 Market Share</div>
              <div class="chart-container">
                <canvas id="pieChart"></canvas>
              </div>
            </div>
            
            <!-- Doughnut Chart -->
            <div class="chart-card">
              <div class="chart-title">🍩 Technology Stack</div>
              <div class="chart-container">
                <canvas id="doughnutChart"></canvas>
              </div>
            </div>
            
            <!-- Radar Chart -->
            <div class="chart-card">
              <div class="chart-title">🎯 Skills Assessment</div>
              <div class="chart-container">
                <canvas id="radarChart"></canvas>
              </div>
            </div>
            
            <!-- Mixed Chart -->
            <div class="chart-card">
              <div class="chart-title">📉 Performance Metrics</div>
              <div class="chart-container">
                <canvas id="mixedChart"></canvas>
              </div>
            </div>
          </div>
          
          <div class="controls">
            <h3>🎮 Interactive Controls</h3>
            <button onclick="updateData()">🔄 Update Data</button>
            <button onclick="randomizeColors()">🎨 Randomize Colors</button>
            <button onclick="animateCharts()">✨ Animate</button>
            <button onclick="exportCharts()">💾 Export Data</button>
            
            <div class="stats">
              <div class="stat-card">
                <div class="stat-value" id="totalSales">$0</div>
                <div class="stat-label">Total Sales</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="avgRevenue">$0</div>
                <div class="stat-label">Avg Revenue</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="chartCount">6</div>
                <div class="stat-label">Active Charts</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="dataPoints">0</div>
                <div class="stat-label">Data Points</div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Color schemes
          const colors = {
            primary: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
            success: ['#11998e', '#38ef7d'],
            warning: ['#f2994a', '#f2c94c'],
            danger: ['#eb3349', '#f45c43'],
            info: ['#667eea', '#764ba2']
          };
          
          // Chart instances storage
          const charts = {};
          
          // 1. LINE CHART - Sales Trend
          charts.line = new Chart(document.getElementById('lineChart'), {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{
                label: '2025 Sales',
                data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 42, 45],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
              }, {
                label: '2026 Sales',
                data: [15, 23, 18, 28, 26, 35, 33, 40, 38, 45, 50, 55],
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
          
          // 2. BAR CHART - Monthly Revenue
          charts.bar = new Chart(document.getElementById('barChart'), {
            type: 'bar',
            data: {
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              datasets: [{
                label: 'Revenue ($1000s)',
                data: [120, 150, 180, 200],
                backgroundColor: [
                  'rgba(102, 126, 234, 0.8)',
                  'rgba(118, 75, 162, 0.8)',
                  'rgba(240, 147, 251, 0.8)',
                  'rgba(79, 172, 254, 0.8)'
                ],
                borderColor: [
                  '#667eea',
                  '#764ba2',
                  '#f093fb',
                  '#4facfe'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
          
          // 3. PIE CHART - Market Share
          charts.pie = new Chart(document.getElementById('pieChart'), {
            type: 'pie',
            data: {
              labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
              datasets: [{
                data: [30, 25, 20, 15, 10],
                backgroundColor: [
                  '#667eea',
                  '#764ba2',
                  '#f093fb',
                  '#4facfe',
                  '#11998e'
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right' }
              }
            }
          });
          
          // 4. DOUGHNUT CHART - Technology Stack
          charts.doughnut = new Chart(document.getElementById('doughnutChart'), {
            type: 'doughnut',
            data: {
              labels: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'],
              datasets: [{
                data: [35, 30, 20, 10, 5],
                backgroundColor: [
                  '#f2994a',
                  '#f2c94c',
                  '#667eea',
                  '#eb3349',
                  '#11998e'
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }
          });
          
          // 5. RADAR CHART - Skills Assessment
          charts.radar = new Chart(document.getElementById('radarChart'), {
            type: 'radar',
            data: {
              labels: ['Coding', 'Design', 'Communication', 'Problem Solving', 'Leadership', 'Teamwork'],
              datasets: [{
                label: 'Developer A',
                data: [90, 70, 80, 85, 75, 88],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                pointBackgroundColor: '#667eea'
              }, {
                label: 'Developer B',
                data: [85, 85, 90, 80, 85, 82],
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.2)',
                pointBackgroundColor: '#764ba2'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }
          });
          
          // 6. MIXED CHART - Performance Metrics
          charts.mixed = new Chart(document.getElementById('mixedChart'), {
            type: 'bar',
            data: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [{
                type: 'line',
                label: 'Target',
                data: [100, 100, 100, 100],
                borderColor: '#eb3349',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false
              }, {
                type: 'bar',
                label: 'Actual Performance',
                data: [85, 92, 98, 105],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
          
          // Interactive Functions
          function updateData() {
            // Update line chart
            charts.line.data.datasets[0].data = charts.line.data.datasets[0].data.map(() => 
              Math.floor(Math.random() * 50) + 10
            );
            charts.line.update();
            
            // Update bar chart
            charts.bar.data.datasets[0].data = charts.bar.data.datasets[0].data.map(() => 
              Math.floor(Math.random() * 200) + 50
            );
            charts.bar.update();
            
            updateStats();
            showNotification('✅ Data updated!');
          }
          
          function randomizeColors() {
            const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);
            
            charts.pie.data.datasets[0].backgroundColor = 
              charts.pie.data.labels.map(() => randomColor());
            charts.pie.update();
            
            charts.doughnut.data.datasets[0].backgroundColor = 
              charts.doughnut.data.labels.map(() => randomColor());
            charts.doughnut.update();
            
            showNotification('🎨 Colors randomized!');
          }
          
          function animateCharts() {
            Object.values(charts).forEach(chart => {
              chart.update('active');
            });
            showNotification('✨ Charts animated!');
          }
          
          function exportCharts() {
            const data = {};
            Object.keys(charts).forEach(key => {
              data[key] = charts[key].data;
            });
            console.log('Chart Data:', JSON.stringify(data, null, 2));
            showNotification('💾 Data exported to console!');
          }
          
          function updateStats() {
            // Calculate total sales
            const totalSales = charts.line.data.datasets[0].data.reduce((a, b) => a + b, 0);
            document.getElementById('totalSales').textContent = '$' + (totalSales * 1000).toLocaleString();
            
            // Calculate average revenue
            const avgRevenue = charts.bar.data.datasets[0].data.reduce((a, b) => a + b, 0) / 
                              charts.bar.data.datasets[0].data.length;
            document.getElementById('avgRevenue').textContent = '$' + Math.round(avgRevenue * 1000).toLocaleString();
            
            // Count data points
            let dataPoints = 0;
            Object.values(charts).forEach(chart => {
              chart.data.datasets.forEach(dataset => {
                dataPoints += dataset.data.length;
              });
            });
            document.getElementById('dataPoints').textContent = dataPoints;
          }
          
          function showNotification(message) {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              color: #667eea;
              padding: 15px 25px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              font-weight: 600;
              z-index: 1000;
              animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
              notification.style.animation = 'slideOut 0.3s ease';
              setTimeout(() => notification.remove(), 300);
            }, 2000);
          }
          
          // Initialize stats
          updateStats();
          
          // Add some CSS animations
          const style = document.createElement('style');
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(400px); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
          
          console.log('🎉 DIRAC Graph Demo loaded successfully!');
          console.log('📊 6 interactive charts ready');
          console.log('🎮 Use the control buttons to interact with the charts');
        </script>
      </body>
    </html>
  </browser>
  
  <output>✨ Graph demo opened at http://localhost:3100</output>
  <output>🎮 Try the interactive buttons to update data, randomize colors, and more!</output>
  <output>💡 Server will keep running - press Ctrl+C to stop</output>
</dirac>

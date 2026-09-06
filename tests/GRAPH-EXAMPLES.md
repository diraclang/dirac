# DIRAC Graph Examples

Complete examples for creating interactive graphs using the `<browser>` tag and Chart.js.

## Files

### 1. **graph-simple.di** - Quick Start
The simplest possible graph example. Perfect for getting started.

**Features:**
- Single line chart
- Minimal code
- Clean and simple

**Run:**
```bash
npm run dirac tests/graph-simple.di
```

### 2. **graph-demo.di** - Full Feature Demo  
Comprehensive showcase with 6 different chart types and interactive controls.

**Features:**
- ✨ 6 chart types: Line, Bar, Pie, Doughnut, Radar, Mixed
- 🎮 Interactive buttons (update data, randomize colors, animate)
- 📊 Live statistics dashboard
- 🎨 Beautiful gradient design
- 🔄 Real-time chart updates

**Run:**
```bash
npm run dirac tests/graph-demo.di
```

**Opens at:** http://localhost:3100

### 3. **graph-python-data.di** - Dynamic Data Generation
Shows how to generate graph data using Python and display it in the browser.

**Features:**
- 🐍 Python data generation with math functions
- 📈 Seasonal pattern + growth trend simulation
- 🔄 Full DIRAC → Python → Browser pipeline
- 📚 Educational comments explaining the flow

**Run:**
```bash
npm run dirac tests/graph-python-data.di
```

**Opens at:** http://localhost:3102

## Chart Types Available

All examples use **Chart.js 4.4.0**, which supports:

- **Line** - Trends over time
- **Bar** - Comparing categories
- **Pie** - Parts of a whole
- **Doughnut** - Like pie, with hole in center
- **Radar** - Multi-dimensional data
- **Scatter** - X-Y relationships
- **Bubble** - 3D data (x, y, size)
- **Polar Area** - Like pie, but with varying radii
- **Mixed** - Combine multiple types

## Quick Reference

### Basic Line Chart
```xml
<browser title="My Chart">
  <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    </head>
    <body>
      <canvas id="myChart"></canvas>
      <script>
        new Chart(document.getElementById('myChart'), {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{
              label: 'Sales',
              data: [12, 19, 15]
            }]
          }
        });
      </script>
    </body>
  </html>
</browser>
```

### With Python Data
```xml
<python result="data">
return json.dumps({
    'labels': ['A', 'B', 'C'],
    'datasets': [{'data': [10, 20, 30]}]
})
</python>

<python result="html">
data_json = globals().get('data', '{}')
return f'''<html>
  <head><script src="...chart.js"></script></head>
  <body>
    <canvas id="chart"></canvas>
    <script>
      new Chart('chart', {{
        type: 'bar',
        data: {data_json}
      }});
    </script>
  </body>
</html>'''
</python>

<browser><variable name="html" /></browser>
```

## Customization Tips

### Colors
```javascript
backgroundColor: '#667eea'  // Solid color
backgroundColor: 'rgba(102, 126, 234, 0.2)'  // With transparency
backgroundColor: ['#667eea', '#764ba2', '#f093fb']  // Multiple
```

### Responsive
```javascript
options: {
  responsive: true,
  maintainAspectRatio: false
}
```

### Animations
```javascript
options: {
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
}
```

### Tooltips
```javascript
options: {
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.label + ': $' + context.parsed.y;
        }
      }
    }
  }
}
```

## Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Chart.js Examples](https://www.chartjs.org/docs/latest/samples/)
- [Color Palette Generator](https://coolors.co/)

## Next Steps

1. **Start simple**: Try `graph-simple.di` first
2. **Explore features**: Run `graph-demo.di` and click the buttons
3. **Add your data**: Modify `graph-python-data.di` with your own calculations
4. **Create custom charts**: Mix and match from the examples

## Tips

- Use `keep-open="true"` to allow page refreshes during development
- Generate data with Python for complex calculations
- Check browser console (F12) for debugging
- Chart.js has excellent TypeScript support if needed

Happy graphing! 📊✨

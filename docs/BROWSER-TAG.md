# Browser Tag

The `<browser>` tag allows you to render HTML content in a browser window directly from DIRAC.

## Features

- ✅ Opens HTML in your default browser
- ✅ Temporary HTTP server (auto-cleanup)
- ✅ Supports full HTML/CSS/JavaScript
- ✅ Multiple server modes (auto-close, keep-open)
- ✅ Custom port or auto-select
- ✅ Cross-platform (macOS, Linux, Windows)
- ✅ **NEW: Capture mode for dynamic HTML generation**

## Two Rendering Modes

### Literal Mode (Default)

In literal mode, HTML content is treated as static and not processed by DIRAC:

```xml
<browser>
  <html>
    <body>
      <h1>Hello World!</h1>
    </body>
  </html>
</browser>
```

### Capture Mode

In capture mode, DIRAC executes children and generates HTML dynamically:

```xml
<defvar name="userName" value="Alice" />

<subroutine name="generate-greeting">
  <div class="greeting">
    <h2>Welcome, <variable name="userName" />!</h2>
    <p>Today is a great day.</p>
  </div>
</subroutine>

<browser mode="capture">
  <html>
    <body>
      <call name="generate-greeting" />
    </body>
  </html>
</browser>
```

**What happens in capture mode:**
- DIRAC tags like `<variable>` and `<call>` are executed
- Unknown HTML tags are output as literal HTML
- Subroutines can generate HTML fragments
- Perfect for dynamic content generation

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | "literal" | Rendering mode: "literal" or "capture" |
| `title` | string | "DIRAC Browser" | Page title |
| `port` | number | auto | HTTP server port |
| `auto-close` | boolean | false | Close server after opening |
| `keep-open` | boolean | false | Keep server running indefinitely |
| `*default*` | - | true | Close after first request (default) |

## Examples

### Simple HTML (Literal Mode)

```xml
<browser title="My Page">
  <html>
    <body><h1>Hello!</h1></body>
  </html>
</browser>
```

### Dynamic Content (Capture Mode)

```xml
<browser>
  <html>
    <head>
      <style>
        body { 
          font-family: Arial; 
          background: #f0f0f0;
          padding: 20px; 
        }
        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Styled Content</h1>
        <p>This is a styled card!</p>
      </div>
    </body>
  </html>
</browser>
```

### Interactive JavaScript

```xml
<browser title="Interactive Demo">
  <html>
    <body>
      <h1>Click Counter</h1>
      <button onclick="count++; updateDisplay()">Click Me!</button>
      <p id="counter">Count: 0</p>
      
      <script>
        let count = 0;
        function updateDisplay() {
          document.getElementById('counter').textContent = 'Count: ' + count;
        }
      </script>
    </body>
  </html>
</browser>
```

### Keep Server Running

```xml
<browser port="3000" keep-open="true">
  <html>
    <body>
      <h1>Server Running</h1>
      <p>Visit http://localhost:3000 anytime</p>
      <p>Server will stay running until DIRAC exits</p>
    </body>
  </html>
</browser>
```

### Using Variables (Future Enhancement)

To use DIRAC variables in HTML, pre-process them with `<eval>` or `<python>`:

```xml
<defvar name="username" value="Alice" />
<defvar name="score" value="95" />

<python result="html">
username = globals().get('username', 'Guest')
score = globals().get('score', '0')

html = f"""
<html>
  <body>
    <h1>Hello {username}!</h1>
    <p>Your score: {score}</p>
  </body>
</html>
"""

return html
</python>

<browser>
  <variable name="html" />
</browser>
```

## Server Lifecycle

**Default behavior**: Server closes after first HTTP request (1 second delay)
- Opens browser
- Serves HTML once
- Auto-closes

**Auto-close mode** (`auto-close="true"`): Server closes 2 seconds after starting
- Good for static content that loads immediately

**Keep-open mode** (`keep-open="true"`): Server runs indefinitely
- Good for dynamic/interactive content
- Allows page refreshes
- Manually close with `:exit` or Ctrl+C in DIRAC

## Platform Support

- **macOS**: Uses `open` command
- **Linux**: Uses `xdg-open` command  
- **Windows**: Uses `start` command

## Implementation Details

The browser tag:
1. Creates a temporary HTTP server
2. Serves the HTML content
3. Opens the URL in your default browser
4. Manages server lifecycle based on attributes

Server is automatically cleaned up when:
- First request is served (default)
- Auto-close timer expires
- DIRAC session ends
- Explicitly closed with `keep-open="false"`

## Advanced: Multiple Windows

You can open multiple browser windows by using different ports:

```xml
<browser port="3001" title="Window 1">
  <html><body><h1>First Window</h1></body></html>
</browser>

<browser port="3002" title="Window 2">
  <html><body><h1>Second Window</h1></body></html>
</browser>
```

## Troubleshooting

**Browser doesn't open?**
- Check if your default browser is set
- Try manually visiting `http://localhost:PORT`
- Check debug output: run DIRAC with `debug="true"`

**Port already in use?**
- Omit the `port` attribute to auto-select
- Or choose a different port number

**Content not loading?**
- Check HTML syntax
- Look for errors in browser console (F12)
- Verify server is running (check DIRAC output)

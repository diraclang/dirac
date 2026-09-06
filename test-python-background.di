<output>Testing Python background execution for long-running servers:</output>

<!-- 
  Background mode is useful for:
  - HTTP/TCP servers that run forever
  - Daemons and background processes
  - Long-running computations you don't want to wait for
  
  NOTE: background="true" means:
  - The process runs in the background (Dirac shell doesn't block)
  - No access to session variables (runs standalone)
  - No result can be returned (result attribute ignored)
  - You must manually kill the process when done
-->

<subroutine name="start-server">
  <python background="true">
<![CDATA[
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello from Dirac Python background server!')
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

print("Starting server on http://localhost:8765", file=sys.stderr)
server = HTTPServer(('localhost', 8765), SimpleHandler)
server.serve_forever()
]]>
  </python>
</subroutine>

<output>Starting Python HTTP server in background...</output>
<start-server />
<output>✓ Server started! The Dirac shell is not blocked.</output>
<output>
Test it: curl http://localhost:8765
Stop it: pkill -f "python3.*8765"
</output>

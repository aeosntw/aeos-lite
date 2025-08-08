import http.server
import socketserver

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    error_message_format = ""  # Disable default error message

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            # Path to your custom 404.html file
            self.path = '/404.html'
            try:
                # Try to open and serve the custom 404 page
                file = open(self.directory + self.path, 'rb')
                self.send_response(404)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(file.read())
                file.close()
            except:
                # Fallback to default error message if 404.html doesn't exist
                super().send_error(404, "File not found")
        else:
            # Handle other errors normally
            super().send_error(code, message, explain)

# Set the directory you want to serve files from (optional)
# If not specified, it will serve from the current directory
directory = "."

with socketserver.TCPServer(("", PORT), lambda *args: CustomHandler(*args, directory=directory)) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
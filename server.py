#!/usr/bin/env python3

import http.server
import socketserver
import os

PORT = 1234  
HTML_FOLDER_PATH = './frontend'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HTML_FOLDER_PATH, **kwargs)

    def do_GET(self):
        if self.path == '/':
            self.send_response(301) 
            self.send_header('Location', '/index.html')
            self.end_headers()
        else:
            super().do_GET()

with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
    print(f"Serving on port {PORT} from {os.path.abspath(HTML_FOLDER_PATH)}")
    httpd.serve_forever()

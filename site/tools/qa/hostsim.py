# Simulates the artifact host: wraps the main page fragment in a skeleton, serves other files as-is.
import http.server, sys, os
ROOT = sys.argv[1]; PORT = int(sys.argv[2])
SKEL = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '</head><body>{}</body></html>')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if path in ('/', '/index.html'):
            body = SKEL.format(open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()).encode()
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()

#!/bin/sh
# Serve the app locally. It needs a web address, not a file:// path.
# Then open http://localhost:8080 on this computer, or
# http://<this-computer's-ip>:8080 on the tablet, on the same wifi.
exec python3 -m http.server "${1:-8080}"

"""Small local static server with HTTP byte-range support for video scrubbing."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import re


class RangeRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def send_head(self):
        path = Path(self.translate_path(self.path))
        if path.is_dir():
            return super().send_head()
        if not path.exists():
            self.send_error(404, "File not found")
            return None

        file = path.open("rb")
        size = path.stat().st_size
        content_type = self.guess_type(str(path))
        match = re.match(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        if match:
            start = int(match.group(1) or 0)
            end = int(match.group(2) or size - 1)
            end = min(end, size - 1)
            if start > end:
                file.close()
                self.send_error(416, "Requested range not satisfiable")
                return None
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Content-Type", content_type)
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            file.seek(start)
            self._range = end - start + 1
            return file

        self.send_response(200)
        self.send_header("Content-Length", str(size))
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self._range = None
        return file

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_range", None)
        if remaining is None:
            return super().copyfile(source, outputfile)
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    server = ThreadingHTTPServer(("127.0.0.1", 4173), RangeRequestHandler)
    print("Realta Fusion: http://127.0.0.1:4173/")
    server.serve_forever()

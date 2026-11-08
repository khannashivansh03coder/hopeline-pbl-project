#!/usr/bin/env python3
"""
HopeLine Web Server
Serves the HopeLine PBL website and syncs directly with the C++ project's data/*.json files.
"""

import http.server
import socketserver
import json
import os
import sys

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", "data"))

socketserver.TCPServer.allow_reuse_address = True

class HopeLineHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            payload = {
                "resources": self.read_json("resources.json"),
                "donors": self.read_json("donors.json"),
                "patients": self.read_json("patients.json"),
                "bloodUnits": self.read_json("blood_units.json")
            }
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/save":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body)
                if "patients" in data:
                    self.write_json("patients.json", data["patients"])
                if "resources" in data:
                    self.write_json("resources.json", data["resources"])
                if "donors" in data:
                    self.write_json("donors.json", data["donors"])
                if "bloodUnits" in data:
                    self.write_json("blood_units.json", data["bloodUnits"])

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b'{"status": "ok", "message": "Successfully synchronized with C++ data files"}')
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
            return

        return super().do_POST()

    def read_json(self, filename):
        file_path = os.path.join(DATA_DIR, filename)
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def write_json(self, filename, content):
        file_path = os.path.join(DATA_DIR, filename)
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=4)
        except Exception as e:
            print(f"Error writing {filename}: {e}")

if __name__ == "__main__":
    current_port = PORT
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), HopeLineHandler) as httpd:
                print("==============================================================")
                print("   HOPELINE SMART HOSPITAL & BLOOD DONOR SYSTEM - WEB APP")
                print(f"   Running live at: http://localhost:{p}")
                print(f"   Synchronizing directly with C++ data in: {DATA_DIR}")
                print("   Press Ctrl+C to stop.")
                print("==============================================================")
                httpd.serve_forever()
                break
        except OSError:
            continue

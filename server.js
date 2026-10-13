// Zero-dependency static server for Railway. Serves ./public on $PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".ico": "image/x-icon", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8",
};

http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("ok"); }
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  if (p.endsWith("/")) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) {
      // single page: unknown paths fall back to the home page
      return fs.readFile(path.join(ROOT, "index.html"), (e2, home) => {
        if (e2) { res.writeHead(500); return res.end("Server error"); }
        res.writeHead(200, { "Content-Type": TYPES[".html"] }); res.end(home);
      });
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=86400",
    });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, "0.0.0.0", () => console.log("TobeHired listening"));

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const projectRoot = __dirname;
const preferredPort = 8000;
const maxPort = 8010;
const shouldOpenBrowser = !process.argv.includes("--no-browser");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function openBrowser(url) {
  exec(`start "" "${url}"`);
}

function sendText(res, statusCode, text) {
  const buffer = Buffer.from(text, "utf8");
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": buffer.length
  });
  res.end(buffer);
}

function resolveFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = decoded === "/" ? "/index.html" : decoded;
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.resolve(projectRoot, `.${normalizedPath}`);

  if (!fullPath.startsWith(projectRoot)) {
    return null;
  }

  return fullPath;
}

function createRequestHandler() {
  return (req, res) => {
    const filePath = resolveFilePath(req.url || "/");

    if (!filePath) {
      sendText(res, 403, "403 Forbidden");
      return;
    }

    fs.stat(filePath, (statErr, stats) => {
      if (statErr) {
        sendText(res, 404, "404 Not Found");
        return;
      }

      const finalPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;

      fs.readFile(finalPath, (readErr, data) => {
        if (readErr) {
          sendText(res, 404, "404 Not Found");
          return;
        }

        const ext = path.extname(finalPath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": contentTypes[ext] || "application/octet-stream",
          "Content-Length": data.length
        });
        res.end(data);
      });
    });
  };
}

function listenOnPort(port) {
  const server = http.createServer(createRequestHandler());

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < maxPort) {
      listenOnPort(port + 1);
      return;
    }

    console.error(`Unable to start local server: ${error.message}`);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://localhost:${port}/`;
    console.log("");
    console.log("Xixia map started");
    console.log(`Open: ${url}`);
    console.log("Stop: close this window or press Ctrl+C");
    console.log("");
    if (shouldOpenBrowser) {
      openBrowser(url);
    }
  });
}

listenOnPort(preferredPort);

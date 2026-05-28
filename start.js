const { spawn } = require("child_process");
const path = require("path");

const cloudflaredPath = path.join(__dirname, "cloudflared");

const tunnel = spawn(cloudflaredPath, ["tunnel", "run", "marvellous"], {
    stdio: "inherit"
});

tunnel.on("error", error => {
    console.error("Cloudflared error:", error);
});

require("./index.js");
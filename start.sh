const { spawn, execSync } = require("child_process");
const path = require("path");

const cloudflaredPath = path.join(__dirname, "cloudflared");

try {
    execSync(`chmod +x ${cloudflaredPath}`);
    console.log("✅ cloudflared permissions fixed");
} catch (err) {
    console.error("chmod failed:", err);
}

const tunnel = spawn(cloudflaredPath, ["tunnel", "run", "marvellous"], {
    stdio: "inherit"
});

tunnel.on("error", error => {
    console.error("Cloudflared error:", error);
});

require("./index.js");
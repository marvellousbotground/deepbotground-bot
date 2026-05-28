const { spawn, execFileSync } = require("child_process");
const path = require("path");

const cloudflaredPath = path.join(__dirname, "cloudflared");

try {
    execFileSync("chmod", ["+x", cloudflaredPath]);
    console.log("✅ cloudflared permissions fixed");
} catch (error) {
    console.error("❌ chmod failed:", error);
}

const tunnel = spawn(cloudflaredPath, ["tunnel", "run", "marvellous"], {
    stdio: "inherit"
});

tunnel.on("error", error => {
    console.error("Cloudflared error:", error);
});

require("./index.js");
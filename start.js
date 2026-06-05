const { spawn, execFileSync } = require("child_process");
const path = require("path");

const cloudflaredPath = path.join(__dirname, "cloudflared");

try {
    execFileSync("chmod", ["+x", cloudflaredPath]);
    console.log("✅ cloudflared permissions fixed");
} catch (error) {
    console.error("❌ chmod failed:", error);
}

try {
    console.log("🔄 Deploying slash commands...");
    execFileSync("node", ["deploy-commands.js"], {
        stdio: "inherit"
    });
    console.log("✅ Slash commands deployed");
} catch (error) {
    console.error("❌ Slash command deploy failed:", error);
}

const tunnel = spawn(cloudflaredPath, ["tunnel", "run", "marvellous"], {
    stdio: "inherit"
});

tunnel.on("error", error => {
    console.error("Cloudflared error:", error);
});

require("./index.js");
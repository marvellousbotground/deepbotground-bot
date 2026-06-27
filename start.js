const { spawn, execFileSync } = require("child_process");
const path = require("path");

function run(command, args) {
    execFileSync(command, args, {
        stdio: "inherit"
    });
}

try {
    console.log("🔄 Force updating from GitHub...");

    run("git", ["fetch", "origin"]);
    run("git", ["reset", "--hard", "origin/main"]);

    run("git", [
        "clean",
        "-fd",
        "-e", "database/",
        "-e", ".env",
        "-e", ".cloudflared/",
        "-e", "cloudflared"
    ]);

    console.log("✅ GitHub update completed");
} catch (error) {
    console.error("❌ GitHub update failed:", error.message);
}

const cloudflaredPath = path.join(__dirname, "cloudflared");

try {
    run("chmod", ["+x", cloudflaredPath]);
    console.log("✅ cloudflared permissions fixed");
} catch (error) {
    console.error("❌ chmod failed:", error.message);
}

try {
    console.log("🔄 Deploying slash commands...");
    run("node", ["deploy-commands.js"]);
    console.log("✅ Slash commands deployed");
} catch (error) {
    console.error("❌ Slash command deploy failed:", error.message);
}

const tunnel = spawn(
    cloudflaredPath,
    [
        "tunnel",
        "--protocol",
        "http2",
        "run",
        "marvellous"
    ],
    {
        stdio: "inherit"
    }
);

tunnel.on("error", error => {
    console.error("Cloudflared error:", error);
});

require("./index.js");
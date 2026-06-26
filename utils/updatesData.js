const fs = require("fs");
const path = require("path");

const updatesPath = path.join(
    __dirname,
    "..",
    "database",
    "updates.json"
);

function ensureUpdatesFile() {
    const dir = path.dirname(updatesPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }

    if (!fs.existsSync(updatesPath)) {
        fs.writeFileSync(
            updatesPath,
            JSON.stringify([], null, 2)
        );
    }
}

function loadUpdates() {
    ensureUpdatesFile();

    try {
        return JSON.parse(
            fs.readFileSync(updatesPath, "utf8")
        );
    } catch (error) {
        console.log("Error loading updates.json:", error.message);
        return [];
    }
}

function saveUpdates(updates) {
    ensureUpdatesFile();

    fs.writeFileSync(
        updatesPath,
        JSON.stringify(updates, null, 2)
    );
}

function makeUpdateId(version, title) {
    const base =
        `${version}-${title}`
            .toLowerCase()
            .replace(/beta/g, "beta")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    return base || `update-${Date.now()}`;
}

module.exports = {
    loadUpdates,
    saveUpdates,
    makeUpdateId
};
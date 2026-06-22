const fs = require("fs");
const path = require("path");

const customBansPath = path.join(
    __dirname,
    "..",
    "database",
    "custombans.json"
);

function loadCustomBans() {
    if (!fs.existsSync(customBansPath)) {
        fs.writeFileSync(customBansPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(customBansPath, "utf8"));
}

function saveCustomBans(data) {
    fs.writeFileSync(customBansPath, JSON.stringify(data, null, 2));
}

function isCustomBanned(userId) {
    const bans = loadCustomBans();
    const ban = bans[userId];

    if (!ban) {
        return null;
    }

    if (ban.expiresAt && ban.expiresAt <= Math.floor(Date.now() / 1000)) {
        delete bans[userId];
        saveCustomBans(bans);
        return null;
    }

    return ban;
}

module.exports = {
    loadCustomBans,
    saveCustomBans,
    isCustomBanned
};
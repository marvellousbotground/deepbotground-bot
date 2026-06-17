const fs = require("fs");
const path = require("path");

const customCharactersPath = path.join(
    __dirname,
    "..",
    "database",
    "customcharacters.json"
);

const customLikesPath = path.join(
    __dirname,
    "..",
    "database",
    "customlikes.json"
);

function loadCustomCharacters() {
    if (!fs.existsSync(customCharactersPath)) {
        fs.writeFileSync(customCharactersPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(customCharactersPath, "utf8"));
}

function saveCustomCharacters(data) {
    fs.writeFileSync(customCharactersPath, JSON.stringify(data, null, 2));
}

function loadCustomLikes() {
    if (!fs.existsSync(customLikesPath)) {
        fs.writeFileSync(customLikesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(customLikesPath, "utf8"));
}

function saveCustomLikes(data) {
    fs.writeFileSync(customLikesPath, JSON.stringify(data, null, 2));
}

module.exports = {
    loadCustomCharacters,
    saveCustomCharacters,
    loadCustomLikes,
    saveCustomLikes
};
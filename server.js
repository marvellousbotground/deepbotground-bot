const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

const profilesPath = path.join(
    __dirname,
    "database",
    "profiles.json"
);

function loadProfiles() {

    if (!fs.existsSync(profilesPath)) {

        fs.writeFileSync(
            profilesPath,
            JSON.stringify({}, null, 2)
        );
    }

    return JSON.parse(
        fs.readFileSync(profilesPath, "utf8")
    );
}

function saveProfiles(data) {

    fs.writeFileSync(
        profilesPath,
        JSON.stringify(data, null, 2)
    );
}

app.get("/roblox/login", (req, res) => {

    const discordId = req.query.discordId;

    if (!discordId) {
        return res.send("Missing Discord ID.");
    }

    const authUrl =
        "https://apis.roblox.com/oauth/v1/authorize" +
        `?client_id=${process.env.ROBLOX_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.ROBLOX_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=openid profile` +
        `&state=${discordId}`;

    res.redirect(authUrl);
});

app.get("/roblox/callback", async (req, res) => {

    const code = req.query.code;
    const discordId = req.query.state;

    if (!code || !discordId) {
        return res.send("Missing code or state.");
    }

    try {

        const tokenResponse = await axios.post(
            "https://apis.roblox.com/oauth/v1/token",

            new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                client_id: process.env.ROBLOX_CLIENT_ID,
                client_secret: process.env.ROBLOX_CLIENT_SECRET,
                redirect_uri: process.env.ROBLOX_REDIRECT_URI
            }),

            {
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                }
            }
        );

        const accessToken =
            tokenResponse.data.access_token;

        const userResponse = await axios.get(
            "https://apis.roblox.com/oauth/v1/userinfo",

            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        const robloxUser = userResponse.data;

        const profiles = loadProfiles();

        // CREATE PROFILE IF NOT EXISTS
        if (!profiles[discordId]) {

            profiles[discordId] = {

                roblox: {},

                mainGame: {

                    wins: 0,
                    kills: 0,
                    pvps: 0,

                    mainCharacters: [
                        "None",
                        "None",
                        "None"
                    ],

                    favoriteSkin: "None",

                    ranked: {
                        rank: "Unranked",
                        points: 0
                    },

                    casual: {
                        level: 1,
                        xp: 0
                    },

                    mainCharacterImage: null
                }
            };
        }

        profiles[discordId].roblox = {

            verified: true,

            id: robloxUser.sub,

            username:
                robloxUser.preferred_username,

            displayName:
                robloxUser.name
        };

        saveProfiles(profiles);

        res.send(`
            <h1>✅ Roblox account connected</h1>
            <p>You can now return to Discord.</p>
        `);

    } catch (error) {

        console.log(
            error.response?.data || error.message
        );

        res.send(`
            <h1>❌ OAuth Error</h1>
            <p>Failed to connect Roblox account.</p>
        `);
    }
});

app.listen(3000, () => {

    console.log(
        "✅ OAuth server running on port 3000"
    );
});
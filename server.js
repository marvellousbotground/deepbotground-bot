require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

const profilesPath = path.join(
    __dirname,
    "database",
    "profiles.json"
);

const customCharactersPath = path.join(
    __dirname,
    "database",
    "customcharacters.json"
);

const customLikesPath = path.join(
    __dirname,
    "database",
    "customlikes.json"
);

const updatesPath = path.join(
    __dirname,
    "database",
    "updates.json"
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

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    return JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
}

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.get("/", (req, res) => {
    res.send(
        "✅ Roblox OAuth server is running."
    );
});

app.get("/api/updates", (req, res) => {
    const updates = loadJSON(updatesPath);

    res.json(
        Array.isArray(updates)
            ? updates
            : []
    );
});

app.get("/api/featured", (req, res) => {
    const customs = loadJSON(customCharactersPath);
    const likes = loadJSON(customLikesPath);

    const featured = Object.entries(customs)
        .filter(([id, custom]) =>
            custom.featured === true &&
            custom.websitePublished === true
        )
        .map(([id, custom]) => ({
            id,
            name: custom.name,
            image: custom.image,
            universe: custom.universe,
            likes: likes[id]?.likes || 0
        }));

    res.json(featured);
});

app.get("/api/featured/:id", (req, res) => {
    const id = req.params.id.toUpperCase();

    const customs = loadJSON(customCharactersPath);
    const likes = loadJSON(customLikesPath);

    const custom = customs[id];

    if (
        !custom ||
        custom.featured !== true ||
        custom.websitePublished !== true
    ) {
        return res.status(404).json({
            error: "Featured character not found."
        });
    }

    res.json({
        id,
        ...custom,
        likes: likes[id]?.likes || 0
    });
});

app.get("/roblox/login", (req, res) => {
    const discordId = req.query.discordId;

    if (!discordId) {
        return res.send(
            "Missing Discord ID."
        );
    }

    const redirectUri =
        encodeURIComponent(
            "https://verify.marvellousbot.win/roblox/callback"
        );

    const robloxAuthUrl =
        `https://apis.roblox.com/oauth/v1/authorize?` +
        `client_id=${process.env.ROBLOX_CLIENT_ID}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&scope=openid+profile` +
        `&state=${discordId}`;

    res.redirect(robloxAuthUrl);
});

app.get("/roblox/callback", async (req, res) => {
    const code = req.query.code;
    const discordId = req.query.state;

    if (!code || !discordId) {
        return res.send(
            "Missing code or state."
        );
    }

    try {
        const tokenResponse =
            await axios.post(
                "https://apis.roblox.com/oauth/v1/token",

                new URLSearchParams({
                    grant_type: "authorization_code",
                    code,

                    client_id:
                        process.env.ROBLOX_CLIENT_ID,

                    client_secret:
                        process.env.ROBLOX_CLIENT_SECRET,

                    redirect_uri:
                        "https://verify.marvellousbot.win/roblox/callback"
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

        const userResponse =
            await axios.get(
                "https://apis.roblox.com/oauth/v1/userinfo",

                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        const robloxUser =
            userResponse.data;

        const profiles =
            loadProfiles();

        if (!profiles[discordId]) {
            profiles[discordId] = {};
        }

        profiles[discordId].roblox = {
            verified: true,

            id:
                robloxUser.sub,

            userId:
                robloxUser.sub,

            username:
                robloxUser.preferred_username,

            displayName:
                robloxUser.name ||
                robloxUser.preferred_username
        };

        saveProfiles(profiles);

        console.log(
            `✅ ${discordId} verified as ${robloxUser.preferred_username}`
        );

        res.send(`
            <html>
                <body style="
                    background:#0f1115;
                    color:white;
                    font-family:sans-serif;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    height:100vh;
                    text-align:center;
                ">
                    <div>
                        <h1>
                            ✅ Verification Successful
                        </h1>

                        <p>
                            Connected as
                            <b>
                                ${robloxUser.preferred_username}
                            </b>
                        </p>

                        <p>
                            You can now return to Discord.
                        </p>
                    </div>
                </body>
            </html>
        `);

    } catch (error) {
        console.error(
            "OAuth Error:",
            error.response?.data || error.message
        );

        res.send(
            "Verification failed."
        );
    }
});

module.exports = app;
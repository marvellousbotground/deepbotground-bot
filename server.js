const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(
    __dirname,
    "..",
    "database",
    "profiles.json"
);

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function saveProfiles(data) {
    fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
}

function createDefaultMainGame() {
    return {
        wins: 0,
        kills: 0,
        pvps: 0,
        mainCharacters: ["None", "None", "None"],
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
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View your profile or another user's profile.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to view.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const profiles = loadProfiles();

        const targetUser =
            interaction.options.getUser("user") || interaction.user;

        const targetId = targetUser.id;

        if (!profiles[targetId]) {
            profiles[targetId] = {};
        }

        const targetProfile = profiles[targetId];

        if (!targetProfile.roblox) {
            targetProfile.roblox = {
                verified: false,
                id: null,
                username: "Not verified",
                displayName: "Not verified"
            };
        }

        if (!targetProfile.mainGame) {
            targetProfile.mainGame = createDefaultMainGame();
        }

        const gameProfile = targetProfile.mainGame;

        if (!gameProfile.mainCharacters) {
            gameProfile.mainCharacters = ["None", "None", "None"];
        }

        if (!gameProfile.ranked) {
            gameProfile.ranked = {
                rank: "Unranked",
                points: 0
            };
        }

        if (!gameProfile.casual) {
            gameProfile.casual = {
                level: 1,
                xp: 0
            };
        }

        if (!gameProfile.favoriteSkin) {
            gameProfile.favoriteSkin = "None";
        }

        if (!gameProfile.mainCharacterImage) {
            gameProfile.mainCharacterImage = null;
        }

        saveProfiles(profiles);

        const mainCharacters = gameProfile.mainCharacters;

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle(`${targetUser.username}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: "Roblox",
                    value: targetProfile.roblox.verified
                        ? `✅ ${targetProfile.roblox.displayName || targetProfile.roblox.username || "Unknown"}`
                        : "❌ Not verified",
                    inline: false
                },
                {
                    name: "Main Characters",
                    value:
                        `1. ${mainCharacters[0] || "None"}\n` +
                        `2. ${mainCharacters[1] || "None"}\n` +
                        `3. ${mainCharacters[2] || "None"}`,
                    inline: true
                },
                {
                    name: "Favorite Skin",
                    value: gameProfile.favoriteSkin || "None",
                    inline: true
                },
                {
                    name: "Stats",
                    value:
                        `Wins: ${gameProfile.wins || 0}\n` +
                        `Kills: ${gameProfile.kills || 0}\n` +
                        `PvPs: ${gameProfile.pvps || 0}`,
                    inline: true
                },
                {
                    name: "Ranked",
                    value:
                        `${gameProfile.ranked.rank || "Unranked"}\n` +
                        `${gameProfile.ranked.points || 0} RP`,
                    inline: true
                },
                {
                    name: "Casual",
                    value:
                        `Level ${gameProfile.casual.level || 1}\n` +
                        `${gameProfile.casual.xp || 0} XP`,
                    inline: true
                }
            );

        if (gameProfile.mainCharacterImage) {
            embed.setImage(gameProfile.mainCharacterImage);
        }

        await interaction.reply({
            embeds: [embed]
        });
    }
};
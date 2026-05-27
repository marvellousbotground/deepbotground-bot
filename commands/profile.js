const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const connectDB = require("../database/mongo.js");

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
        const db = await connectDB();

        const profiles = db.collection("profiles");

        const targetUser =
            interaction.options.getUser("user") || interaction.user;

        const targetId = targetUser.id;

        let targetProfile = await profiles.findOne({
            discordId: targetId
        });

        if (!targetProfile) {
            targetProfile = {
                discordId: targetId,
                roblox: {
                    verified: false,
                    id: null,
                    username: "Not verified",
                    displayName: "Not verified"
                },
                mainGame: createDefaultMainGame()
            };

            await profiles.insertOne(targetProfile);
        }

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
            gameProfile.mainCharacters = [
                "None",
                "None",
                "None"
            ];
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

        await profiles.updateOne(
            {
                discordId: targetId
            },
            {
                $set: {
                    roblox: targetProfile.roblox,
                    mainGame: gameProfile
                }
            }
        );

        const mainCharacters = gameProfile.mainCharacters;

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle(`${targetUser.username}'s Profile`)
            .setThumbnail(
                targetUser.displayAvatarURL({
                    dynamic: true
                })
            )
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
                    value:
                        gameProfile.favoriteSkin || "None",
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
            embed.setImage(
                gameProfile.mainCharacterImage
            );
        }

        await interaction.reply({
            embeds: [embed]
        });
    }
};
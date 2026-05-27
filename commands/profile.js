const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(__dirname, "..", "database", "profiles.json");

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View a player's game profile.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user whose profile you want to view.")
                .setRequired(false)
        ),

    async execute(interaction) {

        const profiles = loadProfiles();

        const authorId = interaction.user.id;

        // CHECK IF AUTHOR HAS CONNECTED PROFILE
        if (!profiles[authorId] || !profiles[authorId].roblox?.verified) {

            const noProfileEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("⚠️ Roblox account not connected")
                .setDescription(
                    "You must connect your Roblox account before viewing profiles.\n\n" +
                    "Use:\n`/editprofile roblox username:YourRobloxUsername`"
                );

            return interaction.reply({
                embeds: [noProfileEmbed],
                ephemeral: true
            });
        }

        // TARGET USER
        const targetUser =
            interaction.options.getUser("user") || interaction.user;

        const targetProfile = profiles[targetUser.id];

        // IF TARGET HAS NO PROFILE
        if (!targetProfile || !targetProfile.roblox?.verified) {

            const missingEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("❌ Profile not found")
                .setDescription(
                    `${targetUser.username} has not connected their Roblox account yet.`
                );

            return interaction.reply({
                embeds: [missingEmbed]
            });
        }

        const gameProfile = targetProfile.mainGame;

        // MAIN CHARACTER IMAGE
        const mainImage =
            gameProfile.mainCharacterImage ||
            "https://tr.rbxcdn.com/180DAY-6d8d4d9ec5f0b4d95a4df2e6f6e0c1cf/420/420/Image/Png/noFilter";

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setAuthor({
                name: targetUser.username,
                iconURL: targetUser.displayAvatarURL()
            })
            .setTitle("🎮 MAIN GAME PROFILE")
            .setImage(mainImage)
            .addFields(
                {
                    name: "🟩 Roblox",
                    value: targetProfile.roblox.username || "Unknown",
                    inline: true
                },
                {
                    name: "🏆 Wins",
                    value: `${gameProfile.wins || 0}`,
                    inline: true
                },
                {
                    name: "☠ Kills",
                    value: `${gameProfile.kills || 0}`,
                    inline: true
                },
                {
                    name: "⚔ PvPs",
                    value: `${gameProfile.pvps || 0}`,
                    inline: true
                },
                {
                    name: "🎨 Favorite Skin",
                    value: gameProfile.favoriteSkin || "None",
                    inline: true
                },
                {
                    name: "🏅 Ranked",
                    value:
                        `${gameProfile.ranked?.rank || "Unranked"} ` +
                        `(${gameProfile.ranked?.points || 0} RP)`,
                    inline: true
                },
                {
                    name: "⭐ Casual Level",
                    value: `Lv. ${gameProfile.casual?.level || 1}`,
                    inline: true
                },
                {
                    name: "🔥 Main Characters",
                    value:
                        `• ${gameProfile.mainCharacters?.[0] || "None"}\n` +
                        `• ${gameProfile.mainCharacters?.[1] || "None"}\n` +
                        `• ${gameProfile.mainCharacters?.[2] || "None"}`,
                    inline: false
                }
            );

        interaction.reply({
            embeds: [embed]
        });
    }
};
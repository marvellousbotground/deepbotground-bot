const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const OWNER_ID = "612102125580713985";

const profilesPath = path.join(__dirname, "..", "database", "profiles.json");

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function saveProfiles(data) {
    fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pr")
        .setDescription("Add or remove RP from a user.")
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("Add or remove RP.")
                .setRequired(true)
                .addChoices(
                    { name: "Add", value: "add" },
                    { name: "Remove", value: "remove" }
                )
        )
        .addStringOption(option =>
            option
                .setName("discord_id")
                .setDescription("Discord user ID.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount of RP.")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ No permission")
                .setDescription("Only xviander can use this command.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const action = interaction.options.getString("action");
        const discordId = interaction.options.getString("discord_id");
        const amount = interaction.options.getInteger("amount");

        const profiles = loadProfiles();

        if (!profiles[discordId]) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Profile not found")
                .setDescription(
                    `No profile was found with this Discord ID:\n\`${discordId}\``
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const profile = profiles[discordId];

        if (!profile.roblox?.verified) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ User not verified")
                .setDescription(
                    `This Discord ID exists, but the user is not verified:\n\`${discordId}\``
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (!profile.mainGame) {
            profile.mainGame = {};
        }

        if (!profile.mainGame.ranked) {
            profile.mainGame.ranked = {
                rank: "Unranked",
                points: 0
            };
        }

        const oldRp = Number(profile.mainGame.ranked.points) || 0;

        let newRp = oldRp;

        if (action === "add") {
            newRp += amount;
        }

        if (action === "remove") {
            newRp -= amount;
        }

        if (newRp < 0) {
            newRp = 0;
        }

        profile.mainGame.ranked.points = newRp;

        saveProfiles(profiles);

        const robloxName =
            profile.roblox.displayName ||
            profile.roblox.username ||
            "Unknown";

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ RP updated")
            .setDescription(
                `**User:** ${robloxName}\n` +
                `**Discord ID:** \`${discordId}\`\n` +
                `**Roblox ID:** \`${profile.roblox.id || "Unknown"}\`\n\n` +
                `**Action:** ${action === "add" ? "Added" : "Removed"} ${amount} RP\n` +
                `**Old RP:** ${oldRp}\n` +
                `**New RP:** ${newRp}`
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
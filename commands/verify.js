const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
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

function saveProfiles(data) {
    fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Connect your Roblox account."),

    async execute(interaction) {
        const profiles = loadProfiles();
        const userId = interaction.user.id;
        const profile = profiles[userId];

        const isVerified = profile?.roblox?.verified;

        const verifyUrl =
            `https://verify.marvellousbot.win/roblox/login?discordId=${userId}`;

        const embed = new EmbedBuilder()
            .setColor(isVerified ? "Green" : "Red")
            .setTitle(
                isVerified
                    ? "✅ Roblox Verified"
                    : "❌ Roblox Not Verified"
            )
            .setDescription(
                isVerified
                    ? `✅ Verified as **${profile.roblox.username || profile.roblox.displayName || "Unknown"}**`
                    : "You are not verified yet.\n\nClick the button below to connect your Roblox account."
            );

        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder()
                .setLabel(isVerified ? "Re-verify" : "Connect Roblox")
                .setStyle(ButtonStyle.Link)
                .setURL(verifyUrl)
        );

        if (isVerified) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`unlink_roblox_${userId}`)
                    .setLabel("Unlink Roblox")
                    .setStyle(ButtonStyle.Danger)
            );
        }

        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        if (!isVerified) return;

        try {
            const buttonInteraction = await response.awaitMessageComponent({
                time: 60000,
                filter: i =>
                    i.user.id === userId &&
                    i.customId === `unlink_roblox_${userId}`
            });

            const confirmEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ Unlink Roblox Account")
                .setDescription(
                    "This will permanently remove your Roblox verification data.\n\nAre you sure?"
                );

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_unlink_${userId}`)
                        .setLabel("Confirm Unlink")
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId(`cancel_unlink_${userId}`)
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Secondary)
                );

            await buttonInteraction.update({
                embeds: [confirmEmbed],
                components: [confirmRow]
            });

            const confirmInteraction = await response.awaitMessageComponent({
                time: 60000,
                filter: i =>
                    i.user.id === userId &&
                    (
                        i.customId === `confirm_unlink_${userId}` ||
                        i.customId === `cancel_unlink_${userId}`
                    )
            });

            if (confirmInteraction.customId === `cancel_unlink_${userId}`) {
                const cancelEmbed = new EmbedBuilder()
                    .setColor("Grey")
                    .setTitle("Cancelled")
                    .setDescription("Your Roblox account is still linked.");

                return confirmInteraction.update({
                    embeds: [cancelEmbed],
                    components: []
                });
            }

            const updatedProfiles = loadProfiles();

            if (updatedProfiles[userId]) {
                updatedProfiles[userId].roblox = {
                    verified: false,
                    userId: null,
                    username: "Not verified",
                    displayName: "Not verified"
                };

                saveProfiles(updatedProfiles);
            }

            const successEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("✅ Roblox Unlinked")
                .setDescription(
                    "Your Roblox account has been unlinked.\nYour verification data has been removed."
                );

            return confirmInteraction.update({
                embeds: [successEmbed],
                components: []
            });

        } catch (error) {
            return;
        }
    }
};
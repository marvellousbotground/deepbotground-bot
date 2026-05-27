const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const connectDB = require("../database/mongo.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Connect your Roblox account."),

    async execute(interaction) {
        const db = await connectDB();
        const profiles = db.collection("profiles");

        const userId = interaction.user.id;

        const profile = await profiles.findOne({
            discordId: userId
        });

        const isVerified = profile?.roblox?.verified;

        const verifyUrl =
            `https://deepbotground.onrender.com/roblox/login?discordId=${userId}`;

        const embed = new EmbedBuilder()
            .setColor(isVerified ? "Green" : "Red")
            .setTitle(
                isVerified
                    ? "✅ Roblox Verified"
                    : "❌ Roblox Not Verified"
            )
            .setDescription(
                isVerified
                    ? `You are already verified as:\n🟩 **${profile.roblox.username || profile.roblox.displayName || "Unknown"}**\n\nYou can re-verify if you want to connect a different Roblox account.`
                    : "You are not verified yet.\n\nClick the button below to connect your Roblox account."
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(
                        isVerified
                            ? "Re-verify Roblox"
                            : "Connect Roblox"
                    )
                    .setStyle(ButtonStyle.Link)
                    .setURL(verifyUrl)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
};
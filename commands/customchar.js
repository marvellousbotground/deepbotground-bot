const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    loadCustomLikes
} = require("../utils/customCharacters");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("customchar")
        .setDescription("View a custom character.")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Custom Character ID.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Custom Character Not Found")
                .setDescription("No custom character exists with that ID.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const likeData = likes[id] || {
            likes: 0,
            users: [],
            featured: false
        };

        const createdAt = custom.createdAt || custom.lastBoost || Math.floor(Date.now() / 1000);
        const lastBoost = custom.lastBoost || createdAt;
        const expiresAt = lastBoost + THIRTY_DAYS;

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle(custom.name)
            .setThumbnail(custom.image || null)
            .setDescription(
                `**Custom Character ID:** \`${custom.id}\`\n` +
                `**Universe:** ${custom.universe || "Unknown"}\n` +
                `**Creator:** <@${custom.creator}>\n` +
                `**Likes:** ❤️ ${likeData.likes || 0}\n` +
                `**Expires:** <t:${expiresAt}:R>\n\n` +
                `⚠️ This custom character is still under construction.\n` +
                `Use \`/editcustomchar\` with this ID to add attacks, skins, lore, and edit the character.`
            )
            .setFooter({
                text: "Custom Character • MarvellousBOTground"
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
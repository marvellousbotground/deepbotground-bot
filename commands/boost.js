const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    saveCustomCharacters
} = require("../utils/customCharacters");

const BOOST_DAYS = 30;
const BOOST_SECONDS = BOOST_DAYS * 24 * 60 * 60;

function now() {
    return Math.floor(Date.now() / 1000);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boost")
        .setDescription("Extend one of your custom characters for 30 days.")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Custom Character ID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
        const custom = customs[id];

        if (!custom) {
            return interaction.reply({
                content: "❌ Custom character not found.",
                ephemeral: true
            });
        }

        if (custom.creator !== interaction.user.id) {
            return interaction.reply({
                content: "❌ You can only boost your own custom characters.",
                ephemeral: true
            });
        }

        if (custom.featured || custom.websitePublished) {
            return interaction.reply({
                content: "❌ Featured or website-published customs do not need boosts.",
                ephemeral: true
            });
        }

        const oldExpiresAt = custom.expiresAt || null;
        const newExpiresAt = now() + BOOST_SECONDS;

        custom.expiresAt = newExpiresAt;
        custom.lastBoost = now();

        saveCustomCharacters(customs);

        const embed = new EmbedBuilder()
            .setColor(0x00ff88)
            .setTitle("🚀 Custom Character Boosted")
            .setDescription(
                `**${custom.name}** has been extended for **30 days**.\n\n` +
                `**ID:** \`${id}\`\n` +
                `**New Expiration:** <t:${newExpiresAt}:F>\n` +
                `**Expires:** <t:${newExpiresAt}:R>\n\n` +
                (
                    oldExpiresAt
                        ? `Previous expiration was <t:${oldExpiresAt}:R>.`
                        : "This custom did not have an expiration date before."
                )
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
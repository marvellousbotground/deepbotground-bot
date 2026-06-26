const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require("discord.js");

const OWNER_ID = "612102125580713985";

const RULES_CHANNEL_ID = "1517778754393608215";
const ERRORS_CHANNEL_ID = "1519557794884358204";

const WEBSITE_URL = "https://marvellousbot.win";
const TERMS_URL = "https://marvellousbot.win/terms.html";
const PRIVACY_URL = "https://marvellousbot.win/privacy.html";
const FEATURED_URL = "https://marvellousbot.win/featured.html";
const UPDATES_URL = "https://marvellousbot.win/updates.html";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("publishinfo")
        .setDescription("Publish the server information embed.")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Information channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option
                .setName("banner")
                .setDescription("Banner image for the info embed")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
                content: "❌ You cannot use this command.",
                ephemeral: true
            });
        }

        const channel =
            interaction.options.getChannel("channel") ||
            interaction.channel;

        const banner =
            interaction.options.getAttachment("banner");

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🛡️ Welcome to Marvellous BOTground")
            .setDescription(
                "Welcome to the official **Marvellous BOTground** server!\n\n" +

                "Here you can:\n\n" +
                "📰 Stay updated with game and bot news.\n" +
                "⚔️ Share PvP clips, ideas, and creations.\n" +
                "🤝 Meet other Marvellous Smackdown players.\n" +
                "🤖 Use **Marvellous BOTground** commands.\n" +
                "🎨 Create and share your own Custom Characters.\n" +
                "⭐ Discover Featured Community Characters.\n\n" +

                `Before participating, please read <#${RULES_CHANNEL_ID}>.\n\n` +

                `Found a bug or error?\nPlease report it in <#${ERRORS_CHANNEL_ID}> so the staff can review it.\n\n` +

                "Use the buttons below to visit the website, read the Terms and Privacy Policy, and explore more BOTground features."
            )
            .addFields(
                {
                    name: "Useful Channels",
                    value:
                        `📜 Rules: <#${RULES_CHANNEL_ID}>\n` +
                        `🐞 Bug Reports: <#${ERRORS_CHANNEL_ID}>`
                },
                {
                    name: "Useful Links",
                    value:
                        `[Website](${WEBSITE_URL})\n` +
                        `[Featured Characters](${FEATURED_URL})\n` +
                        `[Update Logs](${UPDATES_URL})`
                }
            )
            .setFooter({
                text: "Marvellous BOTground"
            });

        if (banner && banner.contentType?.startsWith("image/")) {
            embed.setImage(banner.url);
        }

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Terms of Service")
                .setEmoji("📜")
                .setStyle(ButtonStyle.Link)
                .setURL(TERMS_URL),

            new ButtonBuilder()
                .setLabel("Privacy Policy")
                .setEmoji("🔒")
                .setStyle(ButtonStyle.Link)
                .setURL(PRIVACY_URL)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Website")
                .setEmoji("🌐")
                .setStyle(ButtonStyle.Link)
                .setURL(WEBSITE_URL),

            new ButtonBuilder()
                .setLabel("Featured")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Link)
                .setURL(FEATURED_URL),

            new ButtonBuilder()
                .setLabel("Update Logs")
                .setEmoji("📝")
                .setStyle(ButtonStyle.Link)
                .setURL(UPDATES_URL)
        );

        await interaction.reply({
            content: `Publishing information embed in ${channel}...`,
            ephemeral: true
        });

        await channel.send({
            embeds: [embed],
            components: [row1, row2]
        });

        await interaction.editReply({
            content: `✅ Information embed published in ${channel}.`
        });
    }
};
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    saveCustomCharacters,
    loadCustomLikes,
    saveCustomLikes
} = require("../utils/customCharacters");

const OWNER_ID = "612102125580713985";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fc")
        .setDescription("Feature or unfeature a custom character.")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Custom Character ID")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("action")
                .setDescription("Choose an action")
                .setRequired(true)
                .addChoices(
                    { name: "Feature", value: "feature" },
                    { name: "Unfeature", value: "unfeature" }
                )
        ),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
                content: "❌ You cannot use this command.",
                ephemeral: true
            });
        }

        const id = interaction.options.getString("id").toUpperCase();
        const action = interaction.options.getString("action");

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            return interaction.reply({
                content: "❌ Custom character not found.",
                ephemeral: true
            });
        }

        if (!likes[id]) {
            likes[id] = {
                likes: 0,
                users: [],
                featured: false
            };
        }

        const featured = action === "feature";

        custom.featured = featured;
        likes[id].featured = featured;

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        if (featured) {
            try {
                const owner = await interaction.client.users.fetch(custom.creator);

                await owner.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xf1c40f)
                            .setTitle("⭐ Your custom character was featured!")
                            .setDescription(
                                `Your custom character **${custom.name}** has been featured by MarvellousBOTground.\n\n` +
                                `**ID:** \`${id}\`\n\n` +
                                "Featured customs cannot be edited while they are featured."
                            )
                            .setThumbnail(custom.image || null)
                    ]
                });
            } catch (error) {
                console.log("Could not DM custom owner:", error.message);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(featured ? 0xf1c40f : 0xff5555)
            .setTitle(featured ? "⭐ Custom Featured" : "❌ Custom Unfeatured")
            .setDescription(
                `**${featured ? "⭐ " : ""}${custom.name}**\n\n` +
                `🆔 ID: \`${id}\`\n` +
                `👤 Creator: <@${custom.creator}>\n` +
                `❤️ Likes: ${likes[id].likes || 0}\n\n` +
                (
                    featured
                        ? "This custom character is now featured and locked from edits."
                        : "This custom character has been unfeatured and can be edited again."
                )
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        return interaction.reply({
            embeds: [embed]
        });
    }
};
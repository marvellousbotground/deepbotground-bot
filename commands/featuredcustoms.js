const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    loadCustomLikes
} = require("../utils/customCharacters");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("featuredcustoms")
        .setDescription("View featured custom characters."),

    async execute(interaction) {
        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const featured = Object.values(customs)
            .filter(custom => custom.featured || likes[custom.id]?.featured)
            .sort((a, b) => {
                const likesA = likes[a.id]?.likes || 0;
                const likesB = likes[b.id]?.likes || 0;

                return likesB - likesA;
            })
            .slice(0, 10);

        if (featured.length === 0) {
            return interaction.reply({
                content: "No featured custom characters yet.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("⭐ Featured Custom Characters")
            .setDescription(
                featured.map((custom, index) => {
                    const likeCount = likes[custom.id]?.likes || 0;

                    return (
                        `**${index + 1}. ${custom.name}**\n` +
                        `ID: \`${custom.id}\`\n` +
                        `Creator: <@${custom.creator}>\n` +
                        `❤️ Likes: ${likeCount}`
                    );
                }).join("\n\n")
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
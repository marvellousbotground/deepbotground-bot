const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");

function readUpdateFile(fileName) {
    const path = `./updates/${fileName}`;

    if (!fs.existsSync(path)) {
        return "No update file found.";
    }

    return fs.readFileSync(path, "utf8");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Show game or bot updates")

        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Select update type")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Bot Updates",
                        value: "bot"
                    },
                    {
                        name: "Game Updates",
                        value: "game"
                    }
                )
        ),

    async execute(interaction) {
        const type =
            interaction.options.getString("type");

        if (type === "bot") {

            const embed = new EmbedBuilder()
                .setTitle("📝 Marvellous BOTground Updates")
                .setColor("#c9b38a")
                .setDescription(
                    "View the complete Marvellous BOTground changelog, including new features, fixes, PvP updates, verification updates, and future releases."
                )
                .setFooter({
                    text: "Marvellous BOTground"
                });

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("Open Update Logs")
                            .setStyle(ButtonStyle.Link)
                            .setURL(
                                "https://marvellousbot.win/updates.html"
                            )
                    );

            return interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }

        const content =
            readUpdateFile("game.txt");

        const embed =
            new EmbedBuilder()
                .setTitle(
                    "MARVELLOUS PLAYGROUND GAME UPDATES"
                )
                .setColor(0xff8800)
                .setDescription(
                    content.slice(0, 4000)
                )
                .setImage(
                    "https://media.discordapp.net/attachments/1507041233501950142/1507832698167623830/noFilter.png?ex=6a135621&is=6a1204a1&hm=eb7a601a10c66e414541907cd953d1aec6a029a40b5da77001d5a19dd535b755&=&format=webp&quality=lossless"
                )
                .setFooter({
                    text: "Marvellous BOTground"
                });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
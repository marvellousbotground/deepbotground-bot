const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()

        .setName("createcustomchar")
        .setDescription("Create your own custom character.")

        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Character name.")
                .setRequired(true)
        )

        .addAttachmentOption(option =>
            option
                .setName("image")
                .setDescription("Character image.")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("universe")
                .setDescription("Character universe.")
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName("hp")
                .setDescription("Character HP.")
                .setRequired(true)
                .setMinValue(1)
        )

        .addStringOption(option =>
            option
                .setName("speed")
                .setDescription("Character speed.")
                .setRequired(true)

                .addChoices(
                    {
                        name: "Normal",
                        value: "Normal"
                    },
                    {
                        name: "Slow",
                        value: "Slow"
                    }
                )
        )

        .addBooleanOption(option =>
            option
                .setName("lowhpanim")
                .setDescription("Low HP animation?")
                .setRequired(true)
        )

        .addBooleanOption(option =>
            option
                .setName("canheal")
                .setDescription("Can heal?")
                .setRequired(true)
        ),

    async execute(interaction) {

        const name =
            interaction.options.getString("name");

        const image =
            interaction.options.getAttachment("image");

        const universe =
            interaction.options.getString("universe");

        const hp =
            interaction.options.getInteger("hp");

        const speed =
            interaction.options.getString("speed");

        const lowHpAnim =
            interaction.options.getBoolean("lowhpanim");

        const canHeal =
            interaction.options.getBoolean("canheal");

        const embed = new EmbedBuilder()

            .setColor("Green")

            .setTitle("✅ Custom Character Preview")

            .setDescription(

                `**Name:** ${name}\n` +
                `**Universe:** ${universe}\n` +
                `**HP:** ${hp}\n` +
                `**Speed:** ${speed}\n` +
                `**Low HP Anim:** ${lowHpAnim}\n` +
                `**Can Heal:** ${canHeal}`

            )

            .setImage(image.url);

        await interaction.reply({

            embeds: [embed]

        });

    }

};
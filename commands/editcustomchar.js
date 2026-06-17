const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    saveCustomCharacters
} = require("../utils/customCharacters");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

function getExpiresAt(custom) {
    const base = custom.lastBoost || custom.createdAt || Math.floor(Date.now() / 1000);
    return base + THIRTY_DAYS;
}

function isExpired(custom) {
    return getExpiresAt(custom) <= Math.floor(Date.now() / 1000);
}

function updateSkills(custom) {
    custom.stats.skills = Array.isArray(custom.attacks)
        ? custom.attacks.length
        : 0;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editcustomchar")
        .setDescription("Edit one of your custom characters.")

        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Custom Character ID.")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Edit character name.")
                .setRequired(false)
                .setMaxLength(80)
        )

        .addAttachmentOption(option =>
            option
                .setName("image")
                .setDescription("Edit character image.")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("universe")
                .setDescription("Edit character universe.")
                .setRequired(false)
                .setMaxLength(80)
        )

        .addIntegerOption(option =>
            option
                .setName("hp")
                .setDescription("Edit character HP.")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(9999)
        )

        .addStringOption(option =>
            option
                .setName("speed")
                .setDescription("Edit character speed.")
                .setRequired(false)
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
                .setDescription("Edit low HP animation.")
                .setRequired(false)
        )

        .addBooleanOption(option =>
            option
                .setName("canheal")
                .setDescription("Edit can heal.")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("lore")
                .setDescription("Edit character lore.")
                .setRequired(false)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
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

        if (isExpired(custom)) {
            delete customs[id];
            saveCustomCharacters(customs);

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Custom Character Expired")
                .setDescription("This custom character expired and has been deleted.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (custom.creator !== interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ You cannot edit this character")
                .setDescription("Only the creator of this custom character can edit it.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const name = interaction.options.getString("name");
        const image = interaction.options.getAttachment("image");
        const universe = interaction.options.getString("universe");
        const hp = interaction.options.getInteger("hp");
        const speed = interaction.options.getString("speed");
        const lowHpAnim = interaction.options.getBoolean("lowhpanim");
        const canHeal = interaction.options.getBoolean("canheal");
        const lore = interaction.options.getString("lore");

        const changes = [];

        if (
            !name &&
            !image &&
            !universe &&
            hp === null &&
            !speed &&
            lowHpAnim === null &&
            canHeal === null &&
            !lore
        ) {
            const stats = custom.stats || {};
            const expiresAt = getExpiresAt(custom);

            const embed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle(`Current Custom Character: ${custom.name}`)
                .setThumbnail(custom.image || null)
                .setDescription(
                    `**ID:** \`${custom.id}\`\n` +
                    `**Creator:** <@${custom.creator}>\n` +
                    `**Expires:** <t:${expiresAt}:R>\n\n` +
                    "Use the command options to edit this character."
                )
                .addFields(
                    {
                        name: "Main",
                        value:
                            `**Name:** ${custom.name}\n` +
                            `**Universe:** ${custom.universe || "Unknown"}`,
                        inline: false
                    },
                    {
                        name: "Stats",
                        value:
                            `**HP:** ${stats.hp}\n` +
                            `**Speed:** ${stats.speed}\n` +
                            `**Damage:** ${stats.damage}\n` +
                            `**Skills:** ${stats.skills}\n` +
                            `**Low HP Animation:** ${stats.lowHpAnimation}\n` +
                            `**Can Heal:** ${stats.canHeal}`,
                        inline: false
                    },
                    {
                        name: "Lore",
                        value: custom.lore || "No lore added yet.",
                        inline: false
                    }
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (name) {
            custom.name = name;
            changes.push(`**Name:** ${name}`);
        }

        if (image) {
            if (!image.contentType || !image.contentType.startsWith("image/")) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid image")
                    .setDescription("The uploaded file must be an image.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            custom.image = image.url;
            changes.push("**Image:** updated");
        }

        if (universe) {
            custom.universe = universe;
            changes.push(`**Universe:** ${universe}`);
        }

        if (hp !== null) {
            custom.stats.hp = hp;
            changes.push(`**HP:** ${hp}`);
        }

        if (speed) {
            custom.stats.speed = speed;
            changes.push(`**Speed:** ${speed}`);
        }

        if (lowHpAnim !== null) {
            custom.stats.lowHpAnimation = lowHpAnim;
            changes.push(`**Low HP Animation:** ${lowHpAnim}`);
        }

        if (canHeal !== null) {
            custom.stats.canHeal = canHeal;
            changes.push(`**Can Heal:** ${canHeal}`);
        }

        if (lore) {
            custom.lore = lore;
            changes.push("**Lore:** updated");
        }

        updateSkills(custom);

        saveCustomCharacters(customs);

        const embed = new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ Custom Character Updated")
            .setThumbnail(custom.image || null)
            .setDescription(
                `**${custom.name}** has been updated.\n\n` +
                changes.join("\n")
            )
            .setFooter({
                text: `ID: ${custom.id}`
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const customPath = path.join(
    __dirname,
    "..",
    "database",
    "customCharacters.json"
);

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function loadCustomCharacters() {
    if (!fs.existsSync(customPath)) {
        fs.writeFileSync(customPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(customPath, "utf8"));
}

function saveCustomCharacters(data) {
    fs.writeFileSync(customPath, JSON.stringify(data, null, 2));
}

function removeExpiredCharacters(data) {
    const now = Date.now();
    let removed = 0;

    for (const id of Object.keys(data)) {
        if (data[id].expiresAt && data[id].expiresAt <= now) {
            delete data[id];
            removed++;
        }
    }

    return removed;
}

function generateCustomId(data) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let id;

    do {
        id = "CC-";

        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
    } while (data[id]);

    return id;
}

function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createcustom")
        .setDescription("Create a custom character.")

        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Character name.")
                .setRequired(true)
                .setMaxLength(80)
        )

        .addStringOption(option =>
            option
                .setName("image")
                .setDescription("Character image URL.")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("universe")
                .setDescription("Character universe.")
                .setRequired(true)
                .setMaxLength(80)
        )

        .addIntegerOption(option =>
            option
                .setName("hp")
                .setDescription("Character HP.")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(9999)
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
                .setName("lowhp")
                .setDescription("Does the character have low HP animation?")
                .setRequired(true)
        )

        .addBooleanOption(option =>
            option
                .setName("canheal")
                .setDescription("Can the character heal?")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("lore")
                .setDescription("Character lore.")
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const customCharacters = loadCustomCharacters();

        const removed = removeExpiredCharacters(customCharacters);

        if (removed > 0) {
            saveCustomCharacters(customCharacters);
        }

        const name = interaction.options.getString("name");
        const image = interaction.options.getString("image");
        const universe = interaction.options.getString("universe");
        const hp = interaction.options.getInteger("hp");
        const speed = interaction.options.getString("speed");
        const lowHpAnimation = interaction.options.getBoolean("lowhp");
        const canHeal = interaction.options.getBoolean("canheal");
        const lore = interaction.options.getString("lore");

        if (!isValidUrl(image)) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Invalid image URL")
                .setDescription("Use a valid image URL starting with `http://` or `https://`.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const id = generateCustomId(customCharacters);
        const now = Date.now();

        customCharacters[id] = {
            id,
            ownerId: interaction.user.id,
            ownerTag: interaction.user.tag,
            createdAt: now,
            expiresAt: now + THIRTY_DAYS,
            lastBoostedAt: null,

            name,
            image,
            universe,

            stats: {
                hp,
                speed,
                damage: 5,
                skills: 0,
                lowHpAnimation,
                canHeal
            },

            attacks: [],
            skins: [],

            lore
        };

        saveCustomCharacters(customCharacters);

        const expiresUnix = Math.floor(customCharacters[id].expiresAt / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ Custom character created")
            .setThumbnail(image)
            .setDescription(
                `**${name}** has been created.\n\n` +
                `**ID:** \`${id}\`\n` +
                `**Universe:** ${universe}\n` +
                `**Expires:** <t:${expiresUnix}:D> (<t:${expiresUnix}:R>)\n\n` +
                `Use this ID later to show or edit the character.`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
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

const {
    uploadCustomImage
} = require("../utils/imageUploader");

const {
    isCustomBanned
} = require("../utils/customBans");

const THIRTY_DAYS = 30 * 24 * 60 * 60;
const MAX_CUSTOMS_PER_USER = 5;

function generateCustomID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "CC-";

    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }

    return id;
}

function generateUniqueCustomID(customs) {
    let id;

    do {
        id = generateCustomID();
    } while (customs[id]);

    return id;
}

function getUserCustomCount(customs, userId) {
    return Object.values(customs).filter(
        custom => custom.creator === userId
    ).length;
}

function userHasCustomWithName(customs, userId, name) {
    return Object.values(customs).some(custom =>
        custom.creator === userId &&
        custom.name.toLowerCase() === name.toLowerCase()
    );
}

function containsEmoji(text) {
    if (!text) return false;

    const discordEmojiRegex = /<a?:\w+:\d+>/g;
    const unicodeEmojiRegex = /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u;

    return discordEmojiRegex.test(text) || unicodeEmojiRegex.test(text);
}

function removeExpiredCustoms(customs, likes) {
    const now = Math.floor(Date.now() / 1000);
    let removed = 0;

    for (const id of Object.keys(customs)) {
        const custom = customs[id];

        if (!custom.lastBoost) continue;

        const expiresAt = custom.lastBoost + THIRTY_DAYS;

        if (expiresAt <= now) {
            delete customs[id];
            delete likes[id];
            removed++;
        }
    }

    return removed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createcustomchar")
        .setDescription("Create your own custom character.")

        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Character name.")
                .setRequired(true)
                .setMaxLength(80)
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
        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const removed = removeExpiredCustoms(customs, likes);

        if (removed > 0) {
            saveCustomCharacters(customs);
            saveCustomLikes(likes);
        }

        const name = interaction.options.getString("name");
        const image = interaction.options.getAttachment("image");
        const universe = interaction.options.getString("universe");
        const hp = interaction.options.getInteger("hp");
        const speed = interaction.options.getString("speed");
        const lowHpAnim = interaction.options.getBoolean("lowhpanim");
        const canHeal = interaction.options.getBoolean("canheal");

        const userId = interaction.user.id;

        const ban = isCustomBanned(userId);

        if (ban) {
            return interaction.reply({
                content:
                    `❌ You are banned from creating custom characters.\n\n` +
                    `**Reason:** ${ban.reason}\n` +
                    `**Expires:** ${ban.expiresAt ? `<t:${ban.expiresAt}:R>` : "Permanent"}`,
                ephemeral: true
            });
        }

        if (containsEmoji(name)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Invalid character name")
                        .setDescription("Custom character names cannot contain emojis.")
                ],
                ephemeral: true
            });
        }

        if (containsEmoji(universe)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Invalid universe name")
                        .setDescription("Custom character universes cannot contain emojis.")
                ],
                ephemeral: true
            });
        }

        const userCustomCount = getUserCustomCount(customs, userId);

        if (userCustomCount >= MAX_CUSTOMS_PER_USER) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Custom character limit reached")
                        .setDescription(
                            `You can only own **${MAX_CUSTOMS_PER_USER}** custom characters at the same time.`
                        )
                ],
                ephemeral: true
            });
        }

        if (userHasCustomWithName(customs, userId, name)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Duplicate custom character name")
                        .setDescription(`You already have a custom character named **${name}**.`)
                ],
                ephemeral: true
            });
        }

        if (!image.contentType || !image.contentType.startsWith("image/")) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Invalid image")
                        .setDescription("The uploaded file must be an image.")
                ],
                ephemeral: true
            });
        }

        const id = generateUniqueCustomID(customs);

        let permanentImageUrl;

        try {
            permanentImageUrl = await uploadCustomImage(
                interaction.client,
                image,
                {
                    type: "character",
                    customId: id,
                    characterName: name,
                    creatorId: userId
                }
            );
        } catch (error) {
            console.log("Custom image upload error:", error.message);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ Image upload failed")
                        .setDescription(
                            "The custom character could not be created because the image failed to upload to storage."
                        )
                ],
                ephemeral: true
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + THIRTY_DAYS;

        customs[id] = {
            id,
            creator: userId,

            createdAt: now,
            lastBoost: now,

            featured: false,

            name,
            image: permanentImageUrl,
            universe,

            aliases: [],
            origin: ["custom"],

            stats: {
                hp,
                speed,
                damage: 5,
                skills: 0,
                lowHpAnimation: lowHpAnim,
                canHeal
            },

            attacks: [],
            skins: [],
            lore: "",
            techs: []
        };

        likes[id] = {
            likes: 0,
            users: [],
            featured: false
        };

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        const embed = new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ Custom Character Created")
            .setThumbnail(permanentImageUrl)
            .setDescription(
                `**Name:** ${name}\n` +
                `**Universe:** ${universe}\n` +
                `**Character ID:** \`${id}\`\n` +
                `**Owner:** <@${userId}>\n` +
                `**Expires:** <t:${expiresAt}:D> (<t:${expiresAt}:R>)\n\n` +
                `Use \`/editcustomchar\` with this ID to add attacks, skins, lore, and edit your custom character.`
            )
            .addFields({
                name: "Stats",
                value:
                    `**HP:** ${hp}\n` +
                    `**Speed:** ${speed}\n` +
                    `**Damage:** 5\n` +
                    `**Skills:** 0\n` +
                    `**Low HP Animation:** ${lowHpAnim}\n` +
                    `**Can Heal:** ${canHeal}`,
                inline: false
            })
            .setFooter({
                text: "MarvellousBOTground"
            });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    saveCustomCharacters
} = require("../utils/customCharacters");

const VALID_SLOTS = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "E",
    "1B",
    "2B",
    "3B",
    "4B",
    "5B"
];

const REVIEW_CHANNEL_ID =
    process.env.FEATURED_REVIEW_CHANNEL ||
    process.env.CUSTOM_CHARACTER_IMAGES_CHANNEL;

function now() {
    return Math.floor(Date.now() / 1000);
}

function normalizeSlot(slot) {
    return String(slot || "").trim().toUpperCase();
}

function isVideoAttachment(attachment) {
    if (!attachment) return false;

    if (attachment.contentType && attachment.contentType.startsWith("video/")) {
        return true;
    }

    const filename = String(attachment.name || "").toLowerCase();

    return (
        filename.endsWith(".mp4") ||
        filename.endsWith(".mov") ||
        filename.endsWith(".webm") ||
        filename.endsWith(".mkv")
    );
}

function getAttackBySlot(custom, slot) {
    if (!Array.isArray(custom.attacks)) return null;

    return custom.attacks.find(
        attack => normalizeSlot(attack.slot) === slot
    ) || null;
}

function createAttachmentSource(message, attachmentIndex = 0) {
    return {
        guildId: message.guild?.id || null,
        channelId: message.channel.id,
        messageId: message.id,
        attachmentIndex
    };
}

async function uploadFeaturedReference(
    interaction,
    custom,
    id,
    slot,
    attack,
    description,
    attachment
) {
    if (!REVIEW_CHANNEL_ID) {
        throw new Error("FEATURED_REVIEW_CHANNEL or CUSTOM_CHARACTER_IMAGES_CHANNEL is not set.");
    }

    const channel = await interaction.client.channels.fetch(REVIEW_CHANNEL_ID);

    if (!channel) {
        throw new Error("Review channel not found.");
    }

    const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("⭐ Featured Reference Submitted")
        .setDescription(
            `**Character:** ${custom.name}\n` +
            `**ID:** \`${id}\`\n` +
            `**Creator:** <@${custom.creator}>\n` +
            `**Slot:** ${slot}\n` +
            `**Attack:** ${attack.name}\n\n` +
            `**Description:**\n${description}\n\n` +
            `**Original Video:** ${attachment.url}`
        )
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (custom.image && custom.image.startsWith("http")) {
        embed.setThumbnail(custom.image);
    }

    try {
        const sent = await channel.send({
            embeds: [embed],
            files: [
                {
                    attachment: attachment.url,
                    name: attachment.name || `${id}_${slot}_reference.mp4`
                }
            ]
        });

        const uploadedAttachments = Array.from(sent.attachments.values());
        const uploadedVideo = uploadedAttachments[0];

        if (!uploadedVideo) {
            return {
                url: attachment.url,
                source: null
            };
        }

        return {
            url: uploadedVideo.url,
            source: createAttachmentSource(sent, 0)
        };

    } catch (error) {
        console.log("Video reupload failed, sending URL only:", error.message);

        const sent = await channel.send({
            embeds: [embed]
        });

        return {
            url: attachment.url,
            source: createAttachmentSource(sent, 0)
        };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editfeatured")
        .setDescription("Edit website information for featured custom characters.")

        .addSubcommand(subcommand =>
            subcommand
                .setName("description")
                .setDescription("Add attack description and reference video for the website.")

                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("slot")
                        .setDescription("Attack slot.")
                        .setRequired(true)
                        .addChoices(
                            { name: "1", value: "1" },
                            { name: "2", value: "2" },
                            { name: "3", value: "3" },
                            { name: "4", value: "4" },
                            { name: "5", value: "5" },
                            { name: "E", value: "E" },
                            { name: "1B", value: "1B" },
                            { name: "2B", value: "2B" },
                            { name: "3B", value: "3B" },
                            { name: "4B", value: "4B" },
                            { name: "5B", value: "5B" }
                        )
                )

                .addStringOption(option =>
                    option
                        .setName("description")
                        .setDescription("Describe how this attack works.")
                        .setRequired(true)
                        .setMaxLength(1000)
                )

                .addAttachmentOption(option =>
                    option
                        .setName("attachment")
                        .setDescription("Attack reference video.")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand !== "description") {
            return interaction.reply({
                content: "❌ Unknown subcommand.",
                ephemeral: true
            });
        }

        const id = interaction.options.getString("id").toUpperCase();
        const slot = normalizeSlot(interaction.options.getString("slot"));
        const description = interaction.options.getString("description");
        const attachment = interaction.options.getAttachment("attachment");

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
                content: "❌ Only the creator of this custom character can use this command.",
                ephemeral: true
            });
        }

        if (!custom.featured) {
            return interaction.reply({
                content: "❌ Only featured custom characters can use this command.",
                ephemeral: true
            });
        }

        if (!custom.websiteAccess) {
            return interaction.reply({
                content: "❌ This custom character does not have website editing access.",
                ephemeral: true
            });
        }

        if (
            custom.websiteAccessExpires &&
            custom.websiteAccessExpires <= now()
        ) {
            custom.websiteAccess = false;
            custom.websiteAccessExpires = null;

            saveCustomCharacters(customs);

            return interaction.reply({
                content: "❌ Website editing access has expired.",
                ephemeral: true
            });
        }

        if (!VALID_SLOTS.includes(slot)) {
            return interaction.reply({
                content: "❌ Invalid slot.",
                ephemeral: true
            });
        }

        const attack = getAttackBySlot(custom, slot);

        if (!attack) {
            return interaction.reply({
                content: `❌ This custom character does not have an attack in slot **${slot}**.`,
                ephemeral: true
            });
        }

        if (!isVideoAttachment(attachment)) {
            return interaction.reply({
                content: "❌ The attachment must be a video file.",
                ephemeral: true
            });
        }

        await interaction.deferReply({
            ephemeral: true
        });

        let uploadedVideo;

        try {
            uploadedVideo = await uploadFeaturedReference(
                interaction,
                custom,
                id,
                slot,
                attack,
                description,
                attachment
            );
        } catch (error) {
            console.log("Featured reference upload error:", error.message);

            return interaction.editReply({
                content: "❌ Failed to send the reference video to the review channel."
            });
        }

        if (!custom.website) {
            custom.website = {};
        }

        attack.description = description;
        attack.video = uploadedVideo.url;
        attack.videoSource = uploadedVideo.source;

        custom.website[slot] = {
            attackName: attack.name,
            description,
            video: uploadedVideo.url,
            videoSource: uploadedVideo.source,
            videoName: attachment.name || "video",
            updatedAt: now()
        };

        saveCustomCharacters(customs);

        const embed = new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ Featured Reference Submitted")
            .setDescription(
                `Your reference was sent for review.\n\n` +
                `**Character:** ${custom.name}\n` +
                `**ID:** \`${id}\`\n` +
                `**Slot:** ${slot}\n` +
                `**Attack:** ${attack.name}\n\n` +
                `**Description:**\n${description}`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        return interaction.editReply({
            embeds: [embed]
        });
    }
};
const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

function createAttachmentSource(message, attachmentIndex = 0) {
    return {
        guildId: message.guild?.id || null,
        channelId: message.channel.id,
        messageId: message.id,
        attachmentIndex
    };
}

async function uploadCustomImage(client, attachment, options) {
    const {
        type,
        customId,
        characterName,
        skinName,
        creatorId
    } = options;

    const channelId =
        type === "skin"
            ? process.env.CUSTOM_SKIN_IMAGES_CHANNEL
            : process.env.CUSTOM_CHARACTER_IMAGES_CHANNEL;

    if (!channelId) {
        throw new Error(`Missing image storage channel for type: ${type}`);
    }

    const channel = await client.channels.fetch(channelId);

    if (!channel) {
        throw new Error(`Storage channel not found: ${channelId}`);
    }

    const file = new AttachmentBuilder(attachment.url, {
        name: attachment.name || "custom-image.png"
    });

    const embed = new EmbedBuilder()
        .setColor(type === "skin" ? 0x2ecc71 : 0x00ff99)
        .setTitle(type === "skin" ? "🎨 Custom Skin Image" : "🆕 Custom Character Image")
        .setDescription(
            `**Character:** ${characterName}\n` +
            (skinName ? `**Skin:** ${skinName}\n` : "") +
            `**Custom ID:** \`${customId}\`\n` +
            `**Creator:** <@${creatorId}>\n` +
            `**Creator ID:** \`${creatorId}\``
        )
        .setTimestamp();

    const message = await channel.send({
        embeds: [embed],
        files: [file]
    });

    const uploadedAttachments = Array.from(message.attachments.values());
    const uploaded = uploadedAttachments[0];

    if (!uploaded) {
        throw new Error("Image upload failed.");
    }

    return {
        url: uploaded.url,
        source: createAttachmentSource(message, 0)
    };
}

module.exports = {
    uploadCustomImage
};
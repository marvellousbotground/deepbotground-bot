function createAttachmentSource(message, attachmentIndex = 0) {
    return {
        guildId: message.guild?.id || null,
        channelId: message.channel.id,
        messageId: message.id,
        attachmentIndex
    };
}

function getFirstAttachment(message) {
    const attachments = Array.from(message.attachments.values());

    return {
        attachment: attachments[0] || null,
        attachmentIndex: 0
    };
}

module.exports = {
    createAttachmentSource,
    getFirstAttachment
};
const fs = require("fs");
const path = require("path");

const customCharactersPath = path.join(
    __dirname,
    "..",
    "database",
    "customcharacters.json"
);

function loadCustomCharacters() {
    if (!fs.existsSync(customCharactersPath)) {
        fs.writeFileSync(
            customCharactersPath,
            JSON.stringify({}, null, 2)
        );
    }

    return JSON.parse(
        fs.readFileSync(customCharactersPath, "utf8")
    );
}

function saveCustomCharacters(data) {
    fs.writeFileSync(
        customCharactersPath,
        JSON.stringify(data, null, 2)
    );
}

async function getFreshAttachmentUrl(client, source) {
    if (
        !source ||
        !source.channelId ||
        !source.messageId
    ) {
        return null;
    }

    const channel = await client.channels.fetch(source.channelId);

    if (!channel || !channel.messages) {
        return null;
    }

    const message = await channel.messages.fetch(source.messageId);

    if (!message) {
        return null;
    }

    const attachments = Array.from(message.attachments.values());

    const index = Number.isInteger(source.attachmentIndex)
        ? source.attachmentIndex
        : 0;

    const attachment = attachments[index];

    if (!attachment) {
        return null;
    }

    return attachment.url;
}

async function refreshAttachmentLinks(client) {
    console.log("🔄 Refreshing featured attachment links...");

    const customs = loadCustomCharacters();

    let updated = 0;
    let checked = 0;

    for (const [id, custom] of Object.entries(customs)) {
        if (
            custom.featured !== true ||
            custom.websitePublished !== true
        ) {
            continue;
        }

        checked++;

        try {
            if (custom.imageSource) {
                const freshUrl = await getFreshAttachmentUrl(
                    client,
                    custom.imageSource
                );

                if (freshUrl && freshUrl !== custom.image) {
                    custom.image = freshUrl;
                    updated++;
                }
            }

            if (Array.isArray(custom.attacks)) {
                for (const attack of custom.attacks) {
                    if (!attack.videoSource) continue;

                    const freshUrl = await getFreshAttachmentUrl(
                        client,
                        attack.videoSource
                    );

                    if (freshUrl && freshUrl !== attack.video) {
                        attack.video = freshUrl;
                        updated++;
                    }
                }
            }

            if (Array.isArray(custom.skins)) {
                for (const skin of custom.skins) {
                    if (!skin.imageSource) continue;

                    const freshUrl = await getFreshAttachmentUrl(
                        client,
                        skin.imageSource
                    );

                    if (freshUrl && freshUrl !== skin.image) {
                        skin.image = freshUrl;
                        updated++;
                    }
                }
            }

        } catch (error) {
            console.error(
                `❌ Failed refreshing ${id}:`,
                error.message
            );
        }
    }

    if (updated > 0) {
        saveCustomCharacters(customs);
    }

    console.log(
        `✅ Featured links refreshed. Checked: ${checked}. Updated: ${updated}.`
    );

    return {
        checked,
        updated
    };
}

function startAttachmentLinkRefresher(client) {
    refreshAttachmentLinks(client);

    setInterval(() => {
        refreshAttachmentLinks(client);
    }, 12 * 60 * 60 * 1000);
}

module.exports = {
    refreshAttachmentLinks,
    startAttachmentLinkRefresher
};
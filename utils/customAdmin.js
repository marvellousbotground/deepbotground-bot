const {
    EmbedBuilder
} = require("discord.js");

const {
    refreshAttachmentLinks
} = require("./refreshAttachmentLinks");

const {
    loadCustomCharacters,
    saveCustomCharacters,
    loadCustomLikes,
    saveCustomLikes
} = require("./customCharacters");

const {
    loadCustomBans,
    saveCustomBans
} = require("./customBans");

const OWNER_ID = "612102125580713985";
const FEATURED_CHANNEL_ID = "1517777686309769246";
const ONE_WEEK = 7 * 24 * 60 * 60;

const IMAGE_STORAGE_CHANNEL_ID =
    process.env.CUSTOM_CHARACTER_IMAGES_CHANNEL;

const SKIN_IMAGE_STORAGE_CHANNEL_ID =
    process.env.CUSTOM_SKIN_IMAGES_CHANNEL ||
    process.env.CUSTOM_CHARACTER_IMAGES_CHANNEL;

const FEATURED_REVIEW_CHANNEL_ID =
    process.env.FEATURED_REVIEW_CHANNEL ||
    process.env.CUSTOM_CHARACTER_IMAGES_CHANNEL;

function now() {
    return Math.floor(Date.now() / 1000);
}

function parseDuration(value) {
    if (!value) return "INVALID";

    const lower = value.toLowerCase();

    if (
        lower === "perma" ||
        lower === "perm" ||
        lower === "permanent"
    ) {
        return null;
    }

    const match = lower.match(/^(\d+)(m|h|d)$/);

    if (!match) return "INVALID";

    const amount = Number(match[1]);
    const unit = match[2];

    const seconds = {
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60
    };

    return now() + amount * seconds[unit];
}

function cleanExpiredBans() {
    const bans = loadCustomBans();
    let changed = false;

    for (const userId of Object.keys(bans)) {
        const ban = bans[userId];

        if (ban.expiresAt && ban.expiresAt <= now()) {
            delete bans[userId];
            changed = true;
        }
    }

    if (changed) {
        saveCustomBans(bans);
    }

    return bans;
}

function deleteCustomsByUser(userId) {
    const customs = loadCustomCharacters();
    const likes = loadCustomLikes();

    let deleted = 0;

    for (const id of Object.keys(customs)) {
        if (customs[id].creator === userId) {
            delete customs[id];
            delete likes[id];
            deleted++;
        }
    }

    saveCustomCharacters(customs);
    saveCustomLikes(likes);

    return deleted;
}

function formatBan(userId, ban) {
    return (
        `**User:** \`${userId}\`\n` +
        `**Reason:** ${ban.reason || "No reason provided."}\n` +
        `**Banned by:** <@${ban.bannedBy || ban.moderator || "Unknown"}>\n` +
        `**Created:** <t:${ban.createdAt}:R>\n` +
        `**Expires:** ${ban.expiresAt ? `<t:${ban.expiresAt}:R>` : "Permanent"}`
    );
}

function createAttachmentSource(message, attachmentIndex = 0) {
    return {
        guildId: message.guild?.id || null,
        channelId: message.channel.id,
        messageId: message.id,
        attachmentIndex
    };
}

function getMessageText(message) {
    const content = message.content || "";

    const embedsText = message.embeds
        .map(embed =>
            [
                embed.title,
                embed.description,
                ...(embed.fields || []).map(field => `${field.name} ${field.value}`)
            ].join(" ")
        )
        .join(" ");

    return `${content} ${embedsText}`;
}

function messageContainsCustomId(message, id) {
    return getMessageText(message).includes(id);
}

function messageContainsSlot(message, slot) {
    const text = getMessageText(message);

    return (
        text.includes(`Slot: ${slot}`) ||
        text.includes(`**Slot:** ${slot}`) ||
        text.includes(`Slot ${slot}`) ||
        text.includes(`**Slot** ${slot}`)
    );
}

function messageContainsSkinName(message, skinName) {
    if (!skinName) return false;

    const text = getMessageText(message).toLowerCase();
    return text.includes(String(skinName).toLowerCase());
}

function isImageAttachment(attachment) {
    if (!attachment) return false;

    if (attachment.contentType && attachment.contentType.startsWith("image/")) {
        return true;
    }

    const filename = String(attachment.name || "").toLowerCase();

    return (
        filename.endsWith(".png") ||
        filename.endsWith(".jpg") ||
        filename.endsWith(".jpeg") ||
        filename.endsWith(".webp") ||
        filename.endsWith(".gif")
    );
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

function getFirstValidAttachment(message, type) {
    const attachments = Array.from(message.attachments.values());

    return attachments.find(attachment => {
        if (type === "image") return isImageAttachment(attachment);
        if (type === "video") return isVideoAttachment(attachment);
        return true;
    }) || null;
}

async function findStorageMessage(client, options) {
    const {
        channelId,
        id,
        slot = null,
        skinName = null,
        type = null,
        limit = 500
    } = options;

    if (!channelId) return null;

    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.messages) return null;

    let before;
    let searched = 0;

    while (searched < limit) {
        const messages = await channel.messages.fetch({
            limit: 100,
            before
        });

        if (messages.size === 0) break;

        const found = messages.find(message => {
            if (!messageContainsCustomId(message, id)) return false;
            if (slot && !messageContainsSlot(message, slot)) return false;
            if (skinName && !messageContainsSkinName(message, skinName)) return false;
            if (message.attachments.size === 0) return false;

            const attachment = getFirstValidAttachment(message, type);

            return Boolean(attachment);
        });

        if (found) return found;

        before = messages.last().id;
        searched += messages.size;
    }

    return null;
}

async function migrateCustomSources(client, id) {
    const customs = loadCustomCharacters();
    const custom = customs[id];

    if (!custom) {
        return {
            found: false,
            imageUpdated: false,
            skinsUpdated: 0,
            videosUpdated: 0
        };
    }

    let imageUpdated = false;
    let skinsUpdated = 0;
    let videosUpdated = 0;

    const imageMessage = await findStorageMessage(client, {
        channelId: IMAGE_STORAGE_CHANNEL_ID,
        id,
        type: "image"
    });

    if (imageMessage) {
        const attachment = getFirstValidAttachment(imageMessage, "image");

        if (attachment) {
            custom.image = attachment.url;
            custom.imageSource = createAttachmentSource(imageMessage, 0);
            imageUpdated = true;
        }
    }

    if (Array.isArray(custom.skins)) {
        for (const skin of custom.skins) {
            if (!skin || typeof skin !== "object") continue;

            const skinMessage = await findStorageMessage(client, {
                channelId: SKIN_IMAGE_STORAGE_CHANNEL_ID,
                id,
                skinName: skin.name,
                type: "image"
            });

            if (!skinMessage) continue;

            const attachment = getFirstValidAttachment(skinMessage, "image");

            if (!attachment) continue;

            skin.image = attachment.url;
            skin.imageSource = createAttachmentSource(skinMessage, 0);
            skinsUpdated++;
        }
    }

    if (Array.isArray(custom.attacks)) {
        for (const attack of custom.attacks) {
            const slot = String(attack.slot || "").toUpperCase();

            if (!slot) continue;

            const videoMessage = await findStorageMessage(client, {
                channelId: FEATURED_REVIEW_CHANNEL_ID,
                id,
                slot,
                type: "video"
            });

            if (!videoMessage) continue;

            const attachment = getFirstValidAttachment(videoMessage, "video");

            if (!attachment) continue;

            attack.video = attachment.url;
            attack.videoSource = createAttachmentSource(videoMessage, 0);

            if (!custom.website) {
                custom.website = {};
            }

            if (!custom.website[slot]) {
                custom.website[slot] = {};
            }

            custom.website[slot].attackName = attack.name;
            custom.website[slot].description =
                custom.website[slot].description ||
                attack.description ||
                "";

            custom.website[slot].video = attachment.url;
            custom.website[slot].videoSource = createAttachmentSource(videoMessage, 0);
            custom.website[slot].updatedAt = now();

            videosUpdated++;
        }
    }

    saveCustomCharacters(customs);

    return {
        found: true,
        imageUpdated,
        skinsUpdated,
        videosUpdated
    };
}

async function sendFeaturedDM(client, custom, id) {
    try {
        const owner = await client.users.fetch(custom.creator);

        await owner.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xf1c40f)
                    .setTitle("⭐ Your custom character was featured!")
                    .setDescription(
                        `Congratulations! Your custom character **${custom.name}** has been selected as a **Featured Character** by MarvellousBOTground.\n\n` +
                        `**ID:** \`${id}\`\n\n` +
                        `Your character is now locked from normal edits.\n\n` +
                        `You have **1 week** to use:\n\n` +
                        `\`/editfeatured description\`\n\n` +
                        `Use it to add attack descriptions and reference videos so your character can be published on the MarvellousBOTground website.\n\n` +
                        `After **1 week**, this permission will expire automatically.`
                    )
                    .setThumbnail(custom.image || null)
                    .setFooter({
                        text: "MarvellousBOTground"
                    })
            ]
        });
    } catch (error) {
        console.log("Could not DM custom owner:", error.message);
    }
}

async function sendFeaturedChannelEmbed(client, custom, id) {
    try {
        const channel = await client.channels.fetch(FEATURED_CHANNEL_ID);

        if (!channel) return;

        const lore =
            custom.lore && custom.lore.trim().length > 0
                ? custom.lore.slice(0, 900)
                : "No lore available yet.";

        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("⭐ NEW FEATURED")
            .setDescription(
                `**${custom.name}**\n\n` +
                `**ID:** \`${id}\`\n` +
                `**Creator:** <@${custom.creator}>\n` +
                `**Universe:** ${custom.universe || "Unknown"}\n\n` +
                `**Lore:**\n${lore}`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setImage(custom.image);
        }

        await channel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.log("Could not send featured channel embed:", error.message);
    }
}

async function handleCustomAdmin(message) {
    if (message.author.bot) return false;
    if (!message.content.startsWith("MS!custom")) return false;

    if (message.author.id !== OWNER_ID) {
        await message.reply("❌ You cannot use this command.");
        return true;
    }

    const args = message.content.trim().split(/\s+/);
    const subcommand = args[1]?.toLowerCase();

    if (!subcommand) {
        await message.reply(
            "**Custom Admin Commands**\n\n" +
            "`MS!custom ban <discordId> <30d|12h|60m|perma> <reason>`\n" +
            "`MS!custom unban <discordId>`\n" +
            "`MS!custom bans`\n\n" +
            "`MS!custom feature <customId>`\n" +
            "`MS!custom unfeature <customId>`\n" +
            "`MS!custom web <customId>`\n" +
            "`MS!custom refreshlinks`\n" +
            "`MS!custom migrate <customId>`"
        );
        return true;
    }

    if (subcommand === "ban") {
        const userId = args[2];
        const durationRaw = args[3];
        const reason = args.slice(4).join(" ") || "No reason provided.";

        if (!userId || !durationRaw) {
            await message.reply(
                "❌ Usage: `MS!custom ban <discordId> <30d|12h|60m|perma> <reason>`"
            );
            return true;
        }

        if (!/^\d{15,25}$/.test(userId)) {
            await message.reply("❌ Invalid Discord ID.");
            return true;
        }

        const expiresAt = parseDuration(durationRaw);

        if (expiresAt === "INVALID") {
            await message.reply(
                "❌ Invalid duration. Use `30d`, `12h`, `60m`, or `perma`."
            );
            return true;
        }

        const bans = cleanExpiredBans();

        bans[userId] = {
            reason,
            bannedBy: message.author.id,
            createdAt: now(),
            expiresAt
        };

        saveCustomBans(bans);

        const deleted = deleteCustomsByUser(userId);

        await message.reply(
            `✅ User banned from creating custom characters.\n\n` +
            `**User ID:** \`${userId}\`\n` +
            `**Duration:** ${expiresAt ? `<t:${expiresAt}:R>` : "Permanent"}\n` +
            `**Reason:** ${reason}\n` +
            `**Deleted customs:** ${deleted}`
        );

        return true;
    }

    if (subcommand === "unban") {
        const userId = args[2];

        if (!userId) {
            await message.reply("❌ Usage: `MS!custom unban <discordId>`");
            return true;
        }

        const bans = cleanExpiredBans();

        if (!bans[userId]) {
            await message.reply("❌ This user is not banned.");
            return true;
        }

        delete bans[userId];
        saveCustomBans(bans);

        await message.reply(`✅ User \`${userId}\` was unbanned.`);
        return true;
    }

    if (subcommand === "bans") {
        const bans = cleanExpiredBans();
        const entries = Object.entries(bans);

        if (entries.length === 0) {
            await message.reply("✅ No custom bans.");
            return true;
        }

        const text = entries
            .map(([userId, ban], index) =>
                `**#${index + 1}**\n${formatBan(userId, ban)}`
            )
            .join("\n\n");

        await message.reply(text.slice(0, 1900));
        return true;
    }

    if (subcommand === "feature") {
        const id = args[2]?.toUpperCase();

        if (!id) {
            await message.reply("❌ Usage: `MS!custom feature <customId>`");
            return true;
        }

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            await message.reply("❌ Custom character not found.");
            return true;
        }

        if (!likes[id]) {
            likes[id] = {
                likes: 0,
                users: [],
                featured: false
            };
        }

        custom.featured = true;
        custom.websiteAccess = true;
        custom.websiteAccessExpires = now() + ONE_WEEK;

        likes[id].featured = true;

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        await sendFeaturedDM(message.client, custom, id);
        await sendFeaturedChannelEmbed(message.client, custom, id);

        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("⭐ Custom Featured")
            .setDescription(
                `**${custom.name}** is now featured.\n\n` +
                `**ID:** \`${id}\`\n` +
                `**Creator:** <@${custom.creator}>\n` +
                `**Likes:** ${likes[id].likes || 0}\n\n` +
                `Website access enabled for **1 week**.\n` +
                `The creator was told to use \`/editfeatured description\`.`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        await message.reply({
            embeds: [embed]
        });

        return true;
    }

    if (subcommand === "unfeature") {
        const id = args[2]?.toUpperCase();

        if (!id) {
            await message.reply("❌ Usage: `MS!custom unfeature <customId>`");
            return true;
        }

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            await message.reply("❌ Custom character not found.");
            return true;
        }

        if (!likes[id]) {
            likes[id] = {
                likes: 0,
                users: [],
                featured: false
            };
        }

        custom.featured = false;
        custom.websiteAccess = false;
        custom.websiteAccessExpires = null;
        custom.websitePublished = false;

        likes[id].featured = false;

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        const embed = new EmbedBuilder()
            .setColor(0xff5555)
            .setTitle("❌ Custom Unfeatured")
            .setDescription(
                `**${custom.name}** is no longer featured.\n\n` +
                `**ID:** \`${id}\`\n` +
                `**Creator:** <@${custom.creator}>\n\n` +
                `Website access was disabled.`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        await message.reply({
            embeds: [embed]
        });

        return true;
    }

    if (subcommand === "web") {
        const id = args[2]?.toUpperCase();

        if (!id) {
            await message.reply("❌ Usage: `MS!custom web <customId>`");
            return true;
        }

        const customs = loadCustomCharacters();
        const custom = customs[id];

        if (!custom) {
            await message.reply("❌ Custom character not found.");
            return true;
        }

        if (!custom.featured) {
            await message.reply("❌ This custom character is not featured.");
            return true;
        }

        custom.websiteAccess = false;
        custom.websiteAccessExpires = null;
        custom.websitePublished = true;

        saveCustomCharacters(customs);

        const embed = new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ Custom Published To Website")
            .setDescription(
                `**${custom.name}** was marked as uploaded to the website.\n\n` +
                `**ID:** \`${id}\`\n` +
                `**Creator:** <@${custom.creator}>\n\n` +
                `Website editing access was removed.`
            )
            .setFooter({
                text: "MarvellousBOTground"
            });

        if (custom.image && custom.image.startsWith("http")) {
            embed.setThumbnail(custom.image);
        }

        await message.reply({
            embeds: [embed]
        });

        return true;
    }

    if (subcommand === "refreshlinks") {
        const result = await refreshAttachmentLinks(message.client);

        await message.reply(
            `✅ Featured links refreshed.\n\n` +
            `**Checked:** ${result.checked}\n` +
            `**Updated:** ${result.updated}`
        );

        return true;
    }

    if (subcommand === "migrate") {
        const id = args[2]?.toUpperCase();

        if (!id) {
            await message.reply("❌ Usage: `MS!custom migrate <customId>`");
            return true;
        }

        const result = await migrateCustomSources(message.client, id);

        if (!result.found) {
            await message.reply("❌ Custom character not found.");
            return true;
        }

        await message.reply(
            `✅ Custom source migration completed.\n\n` +
            `**ID:** \`${id}\`\n` +
            `**Image updated:** ${result.imageUpdated ? "Yes" : "No"}\n` +
            `**Skins updated:** ${result.skinsUpdated}\n` +
            `**Videos updated:** ${result.videosUpdated}`
        );

        return true;
    }

    await message.reply("❌ Unknown subcommand.");
    return true;
}

module.exports = {
    handleCustomAdmin
};
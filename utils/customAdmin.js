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

function parseDuration(value) {
    if (!value) return null;

    const lower = value.toLowerCase();

    if (lower === "perma" || lower === "perm" || lower === "permanent") {
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

    return Math.floor(Date.now() / 1000) + amount * seconds[unit];
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

async function handleCustomAdmin(message) {
    if (!message.content.startsWith("MS!custom")) return false;
    if (message.author.bot) return true;

    if (message.author.id !== OWNER_ID) {
        await message.reply("❌ You cannot use this command.");
        return true;
    }

    const args = message.content.trim().split(/\s+/);
    const subcommand = args[1]?.toLowerCase();

    if (!subcommand) {
        await message.reply(
            "Usage:\n" +
            "`MS!custom ban <discordId> <30d|perma> <reason>`\n" +
            "`MS!custom unban <discordId>`\n" +
            "`MS!custom bans`"
        );
        return true;
    }

    if (subcommand === "ban") {
        const userId = args[2];
        const durationRaw = args[3];
        const reason = args.slice(4).join(" ") || "No reason provided.";

        if (!userId || !durationRaw) {
            await message.reply("❌ Usage: `MS!custom ban <discordId> <30d|perma> <reason>`");
            return true;
        }

        if (!/^\d{15,25}$/.test(userId)) {
            await message.reply("❌ Invalid Discord ID.");
            return true;
        }

        const expiresAt = parseDuration(durationRaw);

        if (expiresAt === "INVALID") {
            await message.reply("❌ Invalid duration. Use `30d`, `12h`, `60m`, or `perma`.");
            return true;
        }

        const bans = loadCustomBans();

        bans[userId] = {
            reason,
            bannedBy: message.author.id,
            createdAt: Math.floor(Date.now() / 1000),
            expiresAt
        };

        saveCustomBans(bans);

        const deleted = deleteCustomsByUser(userId);

        await message.reply(
            `✅ User banned from creating customs.\n\n` +
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

        const bans = loadCustomBans();

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
        const bans = loadCustomBans();
        const entries = Object.entries(bans);

        if (entries.length === 0) {
            await message.reply("No custom bans.");
            return true;
        }

        await message.reply(
            entries.map(([userId, ban]) =>
                `**${userId}**\n` +
                `Reason: ${ban.reason}\n` +
                `Expires: ${ban.expiresAt ? `<t:${ban.expiresAt}:R>` : "Permanent"}`
            ).join("\n\n").slice(0, 1900)
        );

        return true;
    }

    await message.reply("❌ Unknown subcommand.");
    return true;
}

module.exports = {
    handleCustomAdmin
};
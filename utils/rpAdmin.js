const {
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const OWNER_ID = "612102125580713985";

const profilesPath = path.join(
    __dirname,
    "..",
    "database",
    "profiles.json"
);

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(
            profilesPath,
            JSON.stringify({}, null, 2)
        );
    }

    return JSON.parse(
        fs.readFileSync(profilesPath, "utf8")
    );
}

function saveProfiles(data) {
    fs.writeFileSync(
        profilesPath,
        JSON.stringify(data, null, 2)
    );
}

function getRankFromRP(rp) {
    const ranks = [
        { name: "Obsidian", rp: 3000, emoji: "⚫" },
        { name: "Emerald", rp: 2600, emoji: "🟢" },
        { name: "Ruby", rp: 2250, emoji: "🔴" },
        { name: "Diamond III", rp: 1950, emoji: "💎" },
        { name: "Diamond II", rp: 1725, emoji: "💎" },
        { name: "Diamond I", rp: 1500, emoji: "💎" },
        { name: "Platinum III", rp: 1275, emoji: "🔷" },
        { name: "Platinum II", rp: 1075, emoji: "🔷" },
        { name: "Platinum I", rp: 875, emoji: "🔷" },
        { name: "Gold III", rp: 675, emoji: "🟡" },
        { name: "Gold II", rp: 575, emoji: "🟡" },
        { name: "Gold I", rp: 475, emoji: "🟡" },
        { name: "Silver III", rp: 375, emoji: "⚪" },
        { name: "Silver II", rp: 300, emoji: "⚪" },
        { name: "Silver I", rp: 225, emoji: "⚪" },
        { name: "Bronze III", rp: 150, emoji: "🟤" },
        { name: "Bronze II", rp: 100, emoji: "🟤" },
        { name: "Bronze I", rp: 50, emoji: "🟤" },
        { name: "Unranked", rp: 0, emoji: "⬛" }
    ];

    return ranks.find(rank => rp >= rank.rp) || ranks[ranks.length - 1];
}

function getUserIdFromMessage(message, raw) {
    if (!raw) return null;

    const mention = raw.match(/^<@!?(\d+)>$/);

    if (mention) {
        return mention[1];
    }

    return raw;
}

async function handleRPAdmin(message) {
    if (message.author.bot) return false;
    if (!message.content.startsWith("MS!rp")) return false;

    if (message.author.id !== OWNER_ID) {
        await message.reply("❌ You cannot use this command.");
        return true;
    }

    const args = message.content.trim().split(/\s+/);
    const action = args[1]?.toLowerCase();
    const userId = getUserIdFromMessage(message, args[2]);
    const amountRaw = args[3];

    if (!action) {
        await message.reply(
            "**RP Admin Commands**\n\n" +
            "`MS!rp add <discordId|@user> <amount>`\n" +
            "`MS!rp remove <discordId|@user> <amount>`\n" +
            "`MS!rp set <discordId|@user> <amount>`\n" +
            "`MS!rp reset <discordId|@user>`"
        );
        return true;
    }

    if (!["add", "remove", "set", "reset"].includes(action)) {
        await message.reply("❌ Unknown action. Use `add`, `remove`, `set`, or `reset`.");
        return true;
    }

    if (!userId || !/^\d{15,25}$/.test(userId)) {
        await message.reply("❌ Invalid Discord ID or mention.");
        return true;
    }

    let amount = Number(amountRaw);

    if (action !== "reset") {
        if (!Number.isInteger(amount) || amount < 0) {
            await message.reply("❌ Amount must be a valid positive number.");
            return true;
        }
    }

    const profiles = loadProfiles();
    const profile = profiles[userId];

    if (!profile) {
        await message.reply(`❌ No profile found for \`${userId}\`.`);
        return true;
    }

    if (!profile.roblox?.verified) {
        await message.reply(`❌ This user exists but is not Roblox verified: \`${userId}\`.`);
        return true;
    }

    if (!profile.mainGame) {
        profile.mainGame = {};
    }

    if (!profile.mainGame.ranked) {
        profile.mainGame.ranked = {
            rank: "Unranked",
            points: 0
        };
    }

    const oldRp = Number(profile.mainGame.ranked.points) || 0;
    let newRp = oldRp;

    if (action === "add") {
        newRp = oldRp + amount;
    }

    if (action === "remove") {
        newRp = oldRp - amount;
    }

    if (action === "set") {
        newRp = amount;
    }

    if (action === "reset") {
        newRp = 0;
        amount = oldRp;
    }

    if (newRp < 0) {
        newRp = 0;
    }

    const rank = getRankFromRP(newRp);

    profile.mainGame.ranked.points = newRp;
    profile.mainGame.ranked.rank = rank.name;

    saveProfiles(profiles);

    const robloxName =
        profile.roblox.displayName ||
        profile.roblox.username ||
        "Unknown";

    const actionText = {
        add: `Added ${amount} RP`,
        remove: `Removed ${amount} RP`,
        set: `Set RP to ${amount}`,
        reset: "Reset RP"
    };

    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("✅ RP Updated")
        .setDescription(
            `**User:** ${robloxName}\n` +
            `**Discord:** <@${userId}>\n` +
            `**Discord ID:** \`${userId}\`\n` +
            `**Roblox ID:** \`${profile.roblox.id || profile.roblox.userId || "Unknown"}\`\n\n` +
            `**Action:** ${actionText[action]}\n` +
            `**Old RP:** ${oldRp}\n` +
            `**New RP:** ${newRp}\n` +
            `**Rank:** ${rank.emoji} ${rank.name}`
        )
        .setFooter({
            text: "MarvellousBOTground"
        });

    await message.reply({
        embeds: [embed]
    });

    return true;
}

module.exports = {
    handleRPAdmin
};
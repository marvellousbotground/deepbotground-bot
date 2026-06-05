const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(__dirname, "..", "database", "profiles.json");

const RANKS = [
    { name: "Unranked", rp: 0 },
    { name: "Bronze I", rp: 50 },
    { name: "Bronze II", rp: 100 },
    { name: "Bronze III", rp: 150 },
    { name: "Silver I", rp: 225 },
    { name: "Silver II", rp: 300 },
    { name: "Silver III", rp: 375 },
    { name: "Gold I", rp: 475 },
    { name: "Gold II", rp: 575 },
    { name: "Gold III", rp: 675 },
    { name: "Platinum I", rp: 875 },
    { name: "Platinum II", rp: 1075 },
    { name: "Platinum III", rp: 1275 },
    { name: "Diamond I", rp: 1500 },
    { name: "Diamond II", rp: 1725 },
    { name: "Diamond III", rp: 1950 },
    { name: "Ruby", rp: 2250 },
    { name: "Emerald", rp: 2600 },
    { name: "Obsidian", rp: 3000 }
];

const RANK_EMOJIS = {
    "Unranked": "<:Runranked:1508994732733370479>",

    "Bronze I": "<:Rbronze:1509002737549971507>",
    "Bronze II": "<:Rbronze:1509002737549971507>",
    "Bronze III": "<:Rbronze:1509002737549971507>",

    "Silver I": "<:Rsilver:1509006126694535198>",
    "Silver II": "<:Rsilver:1509006126694535198>",
    "Silver III": "<:Rsilver:1509006126694535198>",

    "Gold I": "<:Rgold:1509351714518728824>",
    "Gold II": "<:Rgold:1509351714518728824>",
    "Gold III": "<:Rgold:1509351714518728824>",

    "Platinum I": "<:Rplatinum:1509354547200528404>",
    "Platinum II": "<:Rplatinum:1509354547200528404>",
    "Platinum III": "<:Rplatinum:1509354547200528404>",

    "Diamond I": "<:Rdiamond:1509355553980420248>",
    "Diamond II": "<:Rdiamond:1509355553980420248>",
    "Diamond III": "<:Rdiamond:1509355553980420248>",

    "Ruby": "<:Rruby:1509358608335503520>",
    "Emerald": "<:Remerald:1509360948509540352>",
    "Obsidian": "<:Robsidian:1509361944816259314>"
};

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function getRankInfo(points) {
    points = Number(points) || 0;

    let currentRank = RANKS[0];
    let nextRank = null;

    for (let i = 0; i < RANKS.length; i++) {
        if (points >= RANKS[i].rp) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
        }
    }

    const emoji = RANK_EMOJIS[currentRank.name] || "";
    const totalBars = 6;

    if (!nextRank) {
        return {
            rank: currentRank.name,
            emoji,
            points,
            progress: 100,
            bar: "🟩".repeat(totalBars),
            text: `${points} RP`
        };
    }

    const needed = nextRank.rp - currentRank.rp;
    const gained = points - currentRank.rp;

    const progress = Math.max(
        0,
        Math.min(
            100,
            Math.floor((gained / needed) * 100)
        )
    );

    const filled = Math.floor((progress / 100) * totalBars);
    const empty = totalBars - filled;

    return {
        rank: currentRank.name,
        emoji,
        points,
        nextRank: nextRank.name,
        nextRp: nextRank.rp,
        progress,
        bar: "🟩".repeat(filled) + ":black_large_square:".repeat(empty),
        text: `${points} RP`
    };
}

function getProfileThumbnail(gameProfile, targetUser) {
    const source = gameProfile.imageSource || "skin";

    const discordAvatar = targetUser.displayAvatarURL({
        dynamic: true,
        size: 1024
    });

    if (source === "discord") {
        return discordAvatar;
    }

    if (source === "main") {
        return (
            gameProfile.mainCharacterImages?.[0] ||
            discordAvatar
        );
    }

    if (source === "skin") {
        return (
            gameProfile.favoriteSkinImage ||
            discordAvatar
        );
    }

    return discordAvatar;
}

function isValidHexColor(color) {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View your profile or another user's profile.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to view.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const profiles = loadProfiles();

        const targetUser =
            interaction.options.getUser("user") ||
            interaction.user;

        const targetId = targetUser.id;
        const targetProfile = profiles[targetId];

        if (!targetProfile || !targetProfile.roblox?.verified) {
            const isSelf = targetId === interaction.user.id;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setTitle("Profile unavailable")
                .setDescription(
                    isSelf
                        ? "You don't have a profile yet because you are not verified.\n\nUse `/verify` first to create your profile."
                        : "This user does not have a profile because they are not verified."
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const gameProfile = targetProfile.mainGame || {};

        const mainCharacters = gameProfile.mainCharacters || [
            "None",
            "None",
            "None"
        ];

        const rankedPoints = gameProfile.ranked?.points || 0;
        const rankInfo = getRankInfo(rankedPoints);

        const robloxName =
            targetProfile.roblox.displayName ||
            targetProfile.roblox.username ||
            "Unknown";

        const thumbnail = getProfileThumbnail(
            gameProfile,
            targetUser
        );

        const embedColor =
            gameProfile.embedColor &&
            isValidHexColor(gameProfile.embedColor)
                ? gameProfile.embedColor
                : "#2b2d31";

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({
                name: `${targetUser.username}'s Profile`,
                iconURL: targetUser.displayAvatarURL({
                    dynamic: true
                })
            })
            .setThumbnail(thumbnail)
            .setDescription("🎮 **MAIN GAME PROFILE**")
            .addFields(
                {
                    name: "🟩 Roblox",
                    value: robloxName,
                    inline: true
                },
                {
                    name: "🏆 Wins",
                    value: `${gameProfile.wins || 0}`,
                    inline: true
                },
                {
                    name: "💀 Kills",
                    value: `${gameProfile.kills || 0}`,
                    inline: true
                },
                {
                    name: "⚔️ PvPs",
                    value: `${gameProfile.pvps || 0}`,
                    inline: true
                },
                {
                    name: "🎨 Favorite Skin",
                    value: gameProfile.favoriteSkin || "None",
                    inline: true
                },
                {
                    name: `${rankInfo.emoji} ${rankInfo.rank}`,
                    value:
                        `${rankedPoints} RP\n` +
                        `${rankInfo.bar}`,
                    inline: true
                },
                {
                    name: "⭐ Level",
                    value: `${gameProfile.casual?.level || 1}`,
                    inline: true
                },
                {
                    name: "🔥 Main Characters",
                    value:
                        `• ${mainCharacters[0] || "None"}\n` +
                        `• ${mainCharacters[1] || "None"}\n` +
                        `• ${mainCharacters[2] || "None"}`,
                    inline: false
                }
            );

        return interaction.reply({
            embeds: [embed]
        });
    }
};
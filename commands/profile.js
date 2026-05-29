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

    if (!nextRank) {
        return {
            rank: currentRank.name,
            currentRp: currentRank.rp,
            nextRp: currentRank.rp,
            progress: 100,
            bar: "██████████",
            text: `${points} RP`
        };
    }

    const needed = nextRank.rp - currentRank.rp;
    const gained = points - currentRank.rp;
    const progress = Math.max(0, Math.min(100, Math.floor((gained / needed) * 100)));

    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;

    return {
        rank: currentRank.name,
        currentRp: currentRank.rp,
        nextRp: nextRank.rp,
        nextRank: nextRank.name,
        progress,
        bar: "█".repeat(filled) + "░".repeat(empty),
        text: `${points} / ${nextRank.rp} RP`
    };
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
            interaction.options.getUser("user") || interaction.user;

        const targetId = targetUser.id;
        const targetProfile = profiles[targetId];

        if (!targetProfile || !targetProfile.roblox?.verified) {
            const isSelf = targetId === interaction.user.id;

            const embed = new EmbedBuilder()
                .setColor("#ff4d4d")
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
        const mainCharacters = gameProfile.mainCharacters || ["None", "None", "None"];

        const rankedPoints = gameProfile.ranked?.points || 0;
        const rankInfo = getRankInfo(rankedPoints);

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle(`${targetUser.username}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: "Roblox",
                    value: `✅ ${targetProfile.roblox.displayName || targetProfile.roblox.username || "Unknown"}`,
                    inline: false
                },
                {
                    name: "Main Characters",
                    value:
                        `1. ${mainCharacters[0] || "None"}\n` +
                        `2. ${mainCharacters[1] || "None"}\n` +
                        `3. ${mainCharacters[2] || "None"}`,
                    inline: true
                },
                {
                    name: "Favorite Skin",
                    value: gameProfile.favoriteSkin || "None",
                    inline: true
                },
                {
                    name: "Stats",
                    value:
                        `Wins: ${gameProfile.wins || 0}\n` +
                        `Kills: ${gameProfile.kills || 0}\n` +
                        `PvPs: ${gameProfile.pvps || 0}`,
                    inline: true
                },
                {
                    name: "Ranked",
                    value:
                        `**${rankInfo.rank}**\n` +
                        `${rankInfo.text}\n` +
                        `${rankInfo.bar} ${rankInfo.progress}%`,
                    inline: false
                },
                {
                    name: "Casual",
                    value:
                        `Level ${gameProfile.casual?.level || 1}\n` +
                        `${gameProfile.casual?.xp || 0} XP`,
                    inline: true
                }
            );

        if (gameProfile.mainCharacterImage) {
            embed.setImage(gameProfile.mainCharacterImage);
        }

        return interaction.reply({
            embeds: [embed]
        });
    }
};
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(
    __dirname,
    "..",
    "database",
    "profiles.json"
);

const rankEmojis = {
    unranked: "<:Runranked:1508994732733370479>",
    bronze: "<:Rbronze:1509002737549971507>",
    silver: "<:Rsilver:1509006126694535198>",
    gold: "<:Rgold:1509351714518728824>",
    platinum: "<:Rplatinum:1509354547200528404>",
    diamond: "<:Rdiamond:1509355553980420248>",
    ruby: "<:Rruby:1509358608335503520>",
    emerald: "<:Remerald:1509360948509540352>",
    obsidian: "<:Robsidian:1509361944816259314>"
};

const rankList = [
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

function getRequiredXp(level) {
    return Math.floor(100 * Math.pow(1.25, level - 1));
}

function getRank(points) {
    if (points >= 3000) return "Obsidian";
    if (points >= 2600) return "Emerald";
    if (points >= 2250) return "Ruby";

    if (points >= 1950) return "Diamond III";
    if (points >= 1725) return "Diamond II";
    if (points >= 1500) return "Diamond I";

    if (points >= 1275) return "Platinum III";
    if (points >= 1075) return "Platinum II";
    if (points >= 875) return "Platinum I";

    if (points >= 675) return "Gold III";
    if (points >= 575) return "Gold II";
    if (points >= 475) return "Gold I";

    if (points >= 375) return "Silver III";
    if (points >= 300) return "Silver II";
    if (points >= 225) return "Silver I";

    if (points >= 150) return "Bronze III";
    if (points >= 100) return "Bronze II";
    if (points >= 50) return "Bronze I";

    return "Unranked";
}

function getRankEmoji(points) {
    if (points >= 3000) return rankEmojis.obsidian;
    if (points >= 2600) return rankEmojis.emerald;
    if (points >= 2250) return rankEmojis.ruby;

    if (points >= 1500) return rankEmojis.diamond;
    if (points >= 875) return rankEmojis.platinum;
    if (points >= 475) return rankEmojis.gold;
    if (points >= 225) return rankEmojis.silver;
    if (points >= 50) return rankEmojis.bronze;

    return rankEmojis.unranked;
}

function getNextRank(points) {
    for (const rank of rankList) {
        if (points < rank.rp) {
            return {
                name: rank.name,
                needed: rank.rp - points
            };
        }
    }

    return null;
}

function getGlobalRank(userId, profiles) {
    const rankedPlayers = Object.entries(profiles)
        .filter(([_, profile]) => {
            const rp = profile.mainGame?.ranked?.points || 0;
            return profile.mainGame && rp > 0;
        })
        .sort((a, b) => {
            const rpA = a[1].mainGame?.ranked?.points || 0;
            const rpB = b[1].mainGame?.ranked?.points || 0;

            return rpB - rpA;
        });

    const position = rankedPlayers.findIndex(
        ([id]) => id === userId
    );

    return position === -1
        ? "Unranked"
        : `#${position + 1}`;
}

function getProfileImage(profile, target) {
    const mainGame = profile.mainGame;
    const imageSource = mainGame.imageSource || "skin";

    if (imageSource === "discord") {
        return target.displayAvatarURL({
            dynamic: true,
            size: 1024
        });
    }

    if (imageSource === "main") {
        return (
            mainGame.mainCharacterImage ||
            mainGame.mainCharacterImages?.[0] ||
            target.displayAvatarURL({
                dynamic: true,
                size: 1024
            })
        );
    }

    if (imageSource === "skin") {
        return (
            mainGame.favoriteSkinImage ||
            mainGame.mainCharacterImage ||
            mainGame.mainCharacterImages?.[0] ||
            target.displayAvatarURL({
                dynamic: true,
                size: 1024
            })
        );
    }

    return target.displayAvatarURL({
        dynamic: true,
        size: 1024
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pvpstats")
        .setDescription("View PvP statistics.")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to view.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const target =
            interaction.options.getUser("user") ||
            interaction.user;

        if (!fs.existsSync(profilesPath)) {
            return interaction.reply({
                content: "❌ No profiles found.",
                ephemeral: true
            });
        }

        const profiles = JSON.parse(
            fs.readFileSync(profilesPath, "utf8")
        );

        const profile = profiles[target.id];

        if (!profile || !profile.mainGame) {
            return interaction.reply({
                content: "❌ This user does not have a profile.",
                ephemeral: true
            });
        }

        const mainGame = profile.mainGame;

        const wins = mainGame.wins || 0;
        const pvps = mainGame.pvps || 0;

        const casual = mainGame.casual || {};
        const ranked = mainGame.ranked || {};

        const level = casual.level || 1;
        const xp = casual.xp || 0;
        const requiredXp = getRequiredXp(level);

        const rp = ranked.points || 0;
        const rank = getRank(rp);
        const rankEmoji = getRankEmoji(rp);

        const nextRank = getNextRank(rp);
        const globalRank = getGlobalRank(target.id, profiles);

        const winRate =
            pvps > 0
                ? ((wins / pvps) * 100).toFixed(1)
                : "0.0";

        const embedColor =
            mainGame.embedColor ||
            "#2b2d31";

        const profileImage =
            getProfileImage(profile, target);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`⚔️ ${target.username}'s PvP Stats`)
            .addFields(
                {
                    name: "🏆 Wins",
                    value: String(wins),
                    inline: true
                },
                {
                    name: "☠️ PvPs Played",
                    value: String(pvps),
                    inline: true
                },
                {
                    name: "📊 Win Rate",
                    value: `${winRate}%`,
                    inline: true
                },
                {
                    name: "⭐ Level",
                    value: String(level),
                    inline: true
                },
                {
                    name: "✨ XP",
                    value: `${xp}/${requiredXp}`,
                    inline: true
                },
                {
                    name: "🏅 Ranked",
                    value: `${rankEmoji} ${rank}`,
                    inline: true
                },
                {
                    name: "🔥 RP",
                    value: String(rp),
                    inline: true
                },
                {
                    name: "👑 Ranked Position",
                    value: globalRank,
                    inline: true
                },
                {
                    name: "📈 Next Rank",
                    value: nextRank
                        ? `${nextRank.needed} RP until ${nextRank.name}`
                        : "Max Rank Reached",
                    inline: false
                }
            )
            .setThumbnail(profileImage);

        await interaction.reply({
            embeds: [embed]
        });
    }
};
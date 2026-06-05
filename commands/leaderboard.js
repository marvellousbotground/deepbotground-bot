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

function getDisplayName(userId, profile) {
    return (
        profile?.roblox?.username ||
        `<@${userId}>`
    );
}

function getPlacement(index) {
    if (index === 0) return "🥇 #1";
    if (index === 1) return "🥈 #2";
    if (index === 2) return "🥉 #3";

    return `#${index + 1}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View Marvellous BOTground leaderboards.")
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Leaderboard type.")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Casual",
                        value: "casual"
                    },
                    {
                        name: "Ranked",
                        value: "ranked"
                    }
                )
        ),

    async execute(interaction) {
        const type = interaction.options.getString("type");

        if (!fs.existsSync(profilesPath)) {
            return interaction.reply({
                content: "❌ No profiles found.",
                ephemeral: true
            });
        }

        const profiles = JSON.parse(
            fs.readFileSync(profilesPath, "utf8")
        );

        const entries = Object.entries(profiles)
            .filter(([_, profile]) => profile.mainGame)
            .map(([userId, profile]) => {
                const mainGame = profile.mainGame;

                return {
                    userId,
                    profile,
                    wins: mainGame.wins || 0,
                    pvps: mainGame.pvps || 0,
                    level: mainGame.casual?.level || 1,
                    xp: mainGame.casual?.xp || 0,
                    rp: mainGame.ranked?.points || 0
                };
            });

        if (!entries.length) {
            return interaction.reply({
                content: "❌ No leaderboard data found.",
                ephemeral: true
            });
        }

        let sorted;
        let title;
        let description;

        if (type === "casual") {
            sorted = entries
                .filter(entry => entry.wins > 0 || entry.pvps > 0)
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (b.level !== a.level) return b.level - a.level;
                    return b.pvps - a.pvps;
                })
                .slice(0, 10);

            title = "🏆 Casual Leaderboard";

            description = sorted.length
                ? sorted.map((entry, index) => {

                    const placement =
                        getPlacement(index);

                    const name = getDisplayName(
                        entry.userId,
                        entry.profile
                    );

                    return (
                        `**${placement} — ${name}**\n` +
                        `🏆 Wins: **${entry.wins}** | ` +
                        `☠️ PvPs: **${entry.pvps}** | ` +
                        `⭐ Level: **${entry.level}**`
                    );
                }).join("\n\n")
                : "No casual PvP data yet.";
        }

        if (type === "ranked") {
            sorted = entries
                .filter(entry => entry.rp > 0)
                .sort((a, b) => b.rp - a.rp)
                .slice(0, 10);

            title = "🏅 Ranked Leaderboard";

            description = sorted.length
                ? sorted.map((entry, index) => {

                    const placement =
                        getPlacement(index);

                    const name = getDisplayName(
                        entry.userId,
                        entry.profile
                    );

                    return (
                        `**${placement} — ${name}**\n` +
                        `${getRankEmoji(entry.rp)} ${getRank(entry.rp)} | ` +
                        `🔥 RP: **${entry.rp}**`
                    );
                }).join("\n\n")
                : "No ranked data yet.";
        }

        const embed = new EmbedBuilder()
            .setColor(
                type === "ranked"
                    ? "Gold"
                    : "#5865F2"
            )
            .setTitle(title)
            .setDescription(description)
            .setFooter({
                text: "Top 10 players"
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};
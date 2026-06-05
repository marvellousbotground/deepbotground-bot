const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(__dirname, "..", "database", "profiles.json");
const pvpsPath = path.join(__dirname, "..", "database", "pvps.json");

const TEAM_SIZE = {
    "1v1": 1,
    "2v2": 2,
    "3v3": 3,
    "5v5": 5
};

const XP_BY_SIZE = {
    "1v1": 25,
    "2v2": 35,
    "3v3": 50,
    "5v5": 75
};

function loadJson(file, fallback) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getRequiredXp(level) {
    return Math.floor(100 * Math.pow(1.25, level - 1));
}

function ensureProfile(profiles, userId) {
    if (!profiles[userId]) profiles[userId] = {};
    if (!profiles[userId].mainGame) profiles[userId].mainGame = {};
    if (!profiles[userId].mainGame.casual) profiles[userId].mainGame.casual = {};

    profiles[userId].mainGame.wins ??= 0;
    profiles[userId].mainGame.pvps ??= 0;
    profiles[userId].mainGame.casual.level ??= 1;
    profiles[userId].mainGame.casual.xp ??= 0;
}

function addXp(profile, amount) {
    profile.mainGame.casual.xp += amount;

    while (
        profile.mainGame.casual.xp >=
        getRequiredXp(profile.mainGame.casual.level)
    ) {
        profile.mainGame.casual.xp -= getRequiredXp(profile.mainGame.casual.level);
        profile.mainGame.casual.level++;
    }
}

function mentionList(users) {
    if (!users.length) return "*Empty*";
    return users.map(id => `<@${id}>`).join("\n");
}

function loadPvps() {
    return loadJson(pvpsPath, { activeUsers: {} });
}

function isBusy(userId) {
    const pvps = loadPvps();
    return Boolean(pvps.activeUsers[userId]);
}

function setBusy(users, pvpId) {
    const pvps = loadPvps();

    for (const userId of users) {
        pvps.activeUsers[userId] = pvpId;
    }

    saveJson(pvpsPath, pvps);
}

function clearBusy(users) {
    const pvps = loadPvps();

    for (const userId of users) {
        delete pvps.activeUsers[userId];
    }

    saveJson(pvpsPath, pvps);
}

async function safeEdit(message, payload) {
    try {
        return await message.edit(payload);
    } catch {
        const channel = await message.client.channels.fetch(message.channelId);
        const freshMessage = await channel.messages.fetch(message.id);
        return await freshMessage.edit(payload);
    }
}

function lobbyEmbed(size, mode, creatorId, teamA, teamB) {
    const max = TEAM_SIZE[size];

    return new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`⚔️ PvP Lobby — ${size}`)
        .setDescription(
            `**Mode:** ${mode}\n` +
            `**Host:** <@${creatorId}>\n\n` +
            `**Team A (${teamA.length}/${max})**\n${mentionList(teamA)}\n\n` +
            `**Team B (${teamB.length}/${max})**\n${mentionList(teamB)}\n\n` +
            `Players can join using the buttons below.\n` +
            `The host can start once both teams are full.`
        )
        .setFooter({ text: "Lobby expires in 10 minutes." });
}

function lobbyRow(pvpId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`pvp_join_a_${pvpId}`)
            .setLabel("Join Team A")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`pvp_join_b_${pvpId}`)
            .setLabel("Join Team B")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`pvp_leave_${pvpId}`)
            .setLabel("Leave")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`pvp_start_${pvpId}`)
            .setLabel("Start")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`pvp_cancel_${pvpId}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger)
    );
}

function resultRow(pvpId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`pvp_vote_a_${pvpId}`)
            .setLabel("Team A Won")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`pvp_vote_b_${pvpId}`)
            .setLabel("Team B Won")
            .setStyle(ButtonStyle.Primary)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pvp")
        .setDescription("Create a PvP lobby.")
        .addStringOption(option =>
            option
                .setName("size")
                .setDescription("PvP size.")
                .setRequired(true)
                .addChoices(
                    { name: "1v1", value: "1v1" },
                    { name: "2v2", value: "2v2" },
                    { name: "3v3", value: "3v3" },
                    { name: "5v5", value: "5v5" }
                )
        )
        .addStringOption(option =>
            option
                .setName("mode")
                .setDescription("PvP mode.")
                .setRequired(true)
                .addChoices(
                    { name: "Fight to 10", value: "Fight to 10" },
                    { name: "Best of 3", value: "Best of 3" },
                    { name: "1 Life", value: "1 Life" },
                    { name: "Duels Mode", value: "Duels Mode" }
                )
        ),

    async execute(interaction) {
        const size = interaction.options.getString("size");
        const mode = interaction.options.getString("mode");
        const creatorId = interaction.user.id;
        const maxTeamSize = TEAM_SIZE[size];

        if (isBusy(creatorId)) {
            return interaction.reply({
                content: "❌ You are already in an active PvP.",
                ephemeral: true
            });
        }

        const pvpId = `${Date.now()}_${creatorId}`;
        let teamA = [creatorId];
        let teamB = [];

        setBusy([creatorId], pvpId);

        await interaction.reply({
            embeds: [lobbyEmbed(size, mode, creatorId, teamA, teamB)],
            components: [lobbyRow(pvpId)]
        });

        const message = await interaction.fetchReply();

        const lobbyCollector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 600000
        });

        lobbyCollector.on("collect", async i => {
            const userId = i.user.id;
            const inA = teamA.includes(userId);
            const inB = teamB.includes(userId);

            if (i.customId === `pvp_cancel_${pvpId}`) {
                if (userId !== creatorId) {
                    return i.reply({
                        content: "❌ Only the host can cancel this PvP.",
                        ephemeral: true
                    });
                }

                lobbyCollector.stop("cancelled");
                clearBusy([...teamA, ...teamB]);

                return i.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("❌ PvP Cancelled")
                            .setDescription("The host cancelled the PvP lobby.")
                    ],
                    components: []
                });
            }

            if (i.customId === `pvp_leave_${pvpId}`) {
                if (userId === creatorId) {
                    return i.reply({
                        content: "❌ The host cannot leave. Cancel the lobby instead.",
                        ephemeral: true
                    });
                }

                if (!inA && !inB) {
                    return i.reply({
                        content: "❌ You are not in this PvP lobby.",
                        ephemeral: true
                    });
                }

                teamA = teamA.filter(id => id !== userId);
                teamB = teamB.filter(id => id !== userId);
                clearBusy([userId]);

                return i.update({
                    embeds: [lobbyEmbed(size, mode, creatorId, teamA, teamB)],
                    components: [lobbyRow(pvpId)]
                });
            }

            if (i.customId === `pvp_join_a_${pvpId}`) {
                if (!inA && !inB && isBusy(userId)) {
                    return i.reply({
                        content: "❌ You are already in another active PvP.",
                        ephemeral: true
                    });
                }

                if (teamA.length >= maxTeamSize && !inA) {
                    return i.reply({
                        content: "❌ Team A is full.",
                        ephemeral: true
                    });
                }

                teamB = teamB.filter(id => id !== userId);

                if (!teamA.includes(userId)) {
                    teamA.push(userId);
                }

                setBusy([userId], pvpId);

                return i.update({
                    embeds: [lobbyEmbed(size, mode, creatorId, teamA, teamB)],
                    components: [lobbyRow(pvpId)]
                });
            }

            if (i.customId === `pvp_join_b_${pvpId}`) {
                if (!inA && !inB && isBusy(userId)) {
                    return i.reply({
                        content: "❌ You are already in another active PvP.",
                        ephemeral: true
                    });
                }

                if (teamB.length >= maxTeamSize && !inB) {
                    return i.reply({
                        content: "❌ Team B is full.",
                        ephemeral: true
                    });
                }

                teamA = teamA.filter(id => id !== userId);

                if (!teamB.includes(userId)) {
                    teamB.push(userId);
                }

                setBusy([userId], pvpId);

                return i.update({
                    embeds: [lobbyEmbed(size, mode, creatorId, teamA, teamB)],
                    components: [lobbyRow(pvpId)]
                });
            }

            if (i.customId === `pvp_start_${pvpId}`) {
                if (userId !== creatorId) {
                    return i.reply({
                        content: "❌ Only the host can start this PvP.",
                        ephemeral: true
                    });
                }

                if (
                    teamA.length !== maxTeamSize ||
                    teamB.length !== maxTeamSize
                ) {
                    return i.reply({
                        content: `❌ Both teams must have ${maxTeamSize} player(s).`,
                        ephemeral: true
                    });
                }

                lobbyCollector.stop("started");

                const allPlayers = [...teamA, ...teamB];

                await i.update({
                    content: allPlayers.map(id => `<@${id}>`).join(" "),
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Blue")
                            .setTitle(`⚔️ PvP Started — ${size}`)
                            .setDescription(
                                `**Mode:** ${mode}\n\n` +
                                `**Team A**\n${mentionList(teamA)}\n\n` +
                                `**Team B**\n${mentionList(teamB)}\n\n` +
                                `Waiting for results.\nOnly participants can vote.\nThis PvP expires in **1 hour**.`
                            )
                    ],
                    components: [resultRow(pvpId)]
                });

                return startResultPhase({
                    message,
                    size,
                    mode,
                    teamA,
                    teamB,
                    allPlayers,
                    pvpId
                });
            }
        });

        lobbyCollector.on("end", async (_, reason) => {
            if (reason === "started" || reason === "cancelled") return;

            clearBusy([...teamA, ...teamB]);

            await safeEdit(message, {
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("⌛ PvP Lobby Expired")
                        .setDescription("The PvP lobby expired after 10 minutes.")
                ],
                components: []
            }).catch(() => null);
        });
    }
};

async function startResultPhase({
    message,
    size,
    mode,
    teamA,
    teamB,
    allPlayers,
    pvpId
}) {
    const votes = new Map();
    let finished = false;

    const voteCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 3600000
    });

    async function finishMatch(interaction, reason) {
        if (finished) return;
        finished = true;

        clearBusy(allPlayers);

        if (reason !== "A" && reason !== "B") {
            await interaction.update({
                content: "",
                embeds: [
                    new EmbedBuilder()
                        .setColor("Grey")
                        .setTitle("🤝 PvP Draw")
                        .setDescription(
                            "**Result:** Draw\n\nNo XP or wins were awarded."
                        )
                ],
                components: []
            });

            return voteCollector.stop("finished");
        }

        const winningTeam = reason === "A" ? teamA : teamB;
        const xpReward = XP_BY_SIZE[size];

        const profiles = loadJson(profilesPath, {});

        for (const userId of allPlayers) {
            ensureProfile(profiles, userId);
            profiles[userId].mainGame.pvps++;
        }

        for (const userId of winningTeam) {
            ensureProfile(profiles, userId);
            profiles[userId].mainGame.wins++;
            addXp(profiles[userId], xpReward);
        }

        saveJson(profilesPath, profiles);

        await interaction.update({
            content: "",
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`🏆 Team ${reason} Won`)
                    .setDescription(
                        `**Mode:** ${mode}\n\n` +
                        `**Winners**\n${mentionList(winningTeam)}\n\n` +
                        `**Rewards**\n+1 Win\n+${xpReward} XP`
                    )
            ],
            components: []
        });

        return voteCollector.stop("finished");
    }

    voteCollector.on("collect", async i => {
        if (!allPlayers.includes(i.user.id)) {
            return i.reply({
                content: "❌ You are not part of this PvP.",
                ephemeral: true
            });
        }

        if (finished) {
            return i.reply({
                content: "❌ This PvP has already ended.",
                ephemeral: true
            });
        }

        const vote = i.customId.includes("_a_") ? "A" : "B";
        votes.set(i.user.id, vote);

        const allVotes = [...votes.values()];
        const votesA = allVotes.filter(v => v === "A").length;
        const votesB = allVotes.filter(v => v === "B").length;

        if (size === "1v1") {
            if (votes.size < 2) {
                return i.reply({
                    content: `✅ You voted for Team ${vote}.`,
                    ephemeral: true
                });
            }

            if (votesA === 2) return finishMatch(i, "A");
            if (votesB === 2) return finishMatch(i, "B");

            return finishMatch(i, "draw");
        }

        const majority = Math.floor(allPlayers.length / 2) + 1;

        if (votesA >= majority) return finishMatch(i, "A");
        if (votesB >= majority) return finishMatch(i, "B");

        if (votes.size === allPlayers.length && votesA === votesB) {
            return finishMatch(i, "draw");
        }

        return i.reply({
            content: `✅ You voted for Team ${vote}.`,
            ephemeral: true
        });
    });

    voteCollector.on("end", async (_, reason) => {
        if (reason === "finished") return;

        clearBusy(allPlayers);

        return safeEdit(message, {
            content: "",
            embeds: [
                new EmbedBuilder()
                    .setColor("Grey")
                    .setTitle("⌛ PvP Expired")
                    .setDescription(
                        "The PvP expired after 1 hour. No XP or wins were awarded."
                    )
            ],
            components: []
        }).catch(() => null);
    });
}
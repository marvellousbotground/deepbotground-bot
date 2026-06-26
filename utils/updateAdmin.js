const {
    EmbedBuilder
} = require("discord.js");

const {
    loadUpdates,
    saveUpdates,
    makeUpdateId
} = require("./updatesData");

const OWNER_ID = "612102125580713985";
const TIMEOUT_MS = 2 * 60 * 1000;

const sessions = new Map();

function normalizeCommand(content) {
    return content.trim().toLowerCase();
}

function getStepPrompt(step) {
    const prompts = {
        version: "Send the update version.\nExample: `BETA 1.0.5`",
        title: "Send the update title.\nExample: `Featured Update`",
        date: "Send the update date.\nExample: `July 4, 2026`",
        added: "Send the **Added** items, one per message.\nType `DONE` when finished.",
        improved: "Send the **Improved** items, one per message.\nType `DONE` when finished.",
        fixed: "Send the **Fixed** items, one per message.\nType `DONE` when finished."
    };

    return prompts[step] || "Continue.";
}

function clearSession(userId) {
    const session = sessions.get(userId);

    if (session?.timer) {
        clearTimeout(session.timer);
    }

    sessions.delete(userId);
}

function refreshSessionTimeout(message, session) {
    if (session.timer) {
        clearTimeout(session.timer);
    }

    session.timer = setTimeout(async () => {
        sessions.delete(message.author.id);

        try {
            await message.channel.send(
                `⏱️ Update creation cancelled because <@${message.author.id}> took too long to respond.`
            );
        } catch (error) {}
    }, TIMEOUT_MS);
}

async function askNext(message, session) {
    refreshSessionTimeout(message, session);

    await message.channel.send(
        getStepPrompt(session.step)
    );
}

function buildPreview(update) {
    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("📝 Update Created")
        .setDescription(
            `**${update.version} — ${update.title}**\n\n` +
            `**ID:** \`${update.id}\`\n` +
            `**Date:** ${update.date}`
        )
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (update.added.length > 0) {
        embed.addFields({
            name: "Added",
            value: update.added.map(item => `• ${item}`).join("\n").slice(0, 1024)
        });
    }

    if (update.improved.length > 0) {
        embed.addFields({
            name: "Improved",
            value: update.improved.map(item => `• ${item}`).join("\n").slice(0, 1024)
        });
    }

    if (update.fixed.length > 0) {
        embed.addFields({
            name: "Fixed",
            value: update.fixed.map(item => `• ${item}`).join("\n").slice(0, 1024)
        });
    }

    return embed;
}

async function finishSession(message, session) {
    const update = {
        id: makeUpdateId(
            session.data.version,
            session.data.title
        ),
        version: session.data.version,
        title: session.data.title,
        date: session.data.date,
        added: session.data.added,
        improved: session.data.improved,
        fixed: session.data.fixed
    };

    const updates = loadUpdates();

    if (updates.some(item => item.id === update.id)) {
        clearSession(message.author.id);

        await message.reply(
            `❌ An update with ID \`${update.id}\` already exists.`
        );

        return true;
    }

    updates.unshift(update);
    saveUpdates(updates);
    clearSession(message.author.id);

    await message.reply({
        embeds: [
            buildPreview(update)
        ]
    });

    return true;
}

async function handleActiveSession(message) {
    const session = sessions.get(message.author.id);

    if (!session) return false;

    if (message.author.id !== OWNER_ID) return false;

    const content = message.content.trim();

    if (normalizeCommand(content) === "ms!update cancel") {
        clearSession(message.author.id);

        await message.reply(
            "❌ Update creation cancelled."
        );

        return true;
    }

    if (session.step === "version") {
        session.data.version = content;
        session.step = "title";
        await askNext(message, session);
        return true;
    }

    if (session.step === "title") {
        session.data.title = content;
        session.step = "date";
        await askNext(message, session);
        return true;
    }

    if (session.step === "date") {
        session.data.date = content;
        session.step = "added";
        await askNext(message, session);
        return true;
    }

    if (session.step === "added") {
        if (content.toLowerCase() === "done") {
            session.step = "improved";
            await askNext(message, session);
            return true;
        }

        session.data.added.push(content);
        refreshSessionTimeout(message, session);

        await message.react("✅").catch(() => {});
        return true;
    }

    if (session.step === "improved") {
        if (content.toLowerCase() === "done") {
            session.step = "fixed";
            await askNext(message, session);
            return true;
        }

        session.data.improved.push(content);
        refreshSessionTimeout(message, session);

        await message.react("✅").catch(() => {});
        return true;
    }

    if (session.step === "fixed") {
        if (content.toLowerCase() === "done") {
            return finishSession(message, session);
        }

        session.data.fixed.push(content);
        refreshSessionTimeout(message, session);

        await message.react("✅").catch(() => {});
        return true;
    }

    return false;
}

async function handleUpdateAdmin(message) {
    if (message.author.bot) return false;

    const activeHandled = await handleActiveSession(message);

    if (activeHandled) return true;

    if (!message.content.startsWith("MS!update")) return false;

    if (message.author.id !== OWNER_ID) {
        await message.reply("❌ You cannot use this command.");
        return true;
    }

    const args = message.content.trim().split(/\s+/);
    const subcommand = args[1]?.toLowerCase();

    if (!subcommand) {
await message.reply(
    "**Update Admin Commands**\n\n" +
    "`MS!update new`\n" +
    "`MS!update list`\n" +
    "`MS!update import`\n" +
    "`MS!update delete <updateId>`\n" +
    "`MS!update cancel`"
);

        return true;
    }

    if (subcommand === "new") {
        if (sessions.has(message.author.id)) {
            await message.reply(
                "❌ You already have an update creation session active. Use `MS!update cancel` first."
            );

            return true;
        }

        const session = {
            step: "version",
            data: {
                version: "",
                title: "",
                date: "",
                added: [],
                improved: [],
                fixed: []
            },
            timer: null
        };

        sessions.set(message.author.id, session);

        await message.reply(
            "📝 Starting update creation.\nYou can cancel anytime with `MS!update cancel`."
        );

        await askNext(message, session);

        return true;
    }

    if (subcommand === "list") {
        const updates = loadUpdates();

        if (updates.length === 0) {
            await message.reply("No updates registered.");
            return true;
        }

        await message.reply(
            updates
                .map(update =>
                    `**${update.version} — ${update.title}**\n` +
                    `ID: \`${update.id}\`\n` +
                    `Date: ${update.date}`
                )
                .join("\n\n")
                .slice(0, 1900)
        );

        return true;
    }

if (subcommand === "import") {
    const fs = require("fs");
    const path = require("path");

    const oldUpdatesPath = path.join(
        __dirname,
        "..",
        "oldupdates.json"
    );

    if (!fs.existsSync(oldUpdatesPath)) {
        await message.reply("❌ `oldupdates.json` was not found.");
        return true;
    }

    let oldUpdates;

    try {
        oldUpdates = JSON.parse(
            fs.readFileSync(oldUpdatesPath, "utf8")
        );
    } catch (error) {
        await message.reply("❌ `oldupdates.json` is not valid JSON.");
        return true;
    }

    if (!Array.isArray(oldUpdates)) {
        await message.reply("❌ `oldupdates.json` must be an array.");
        return true;
    }

    const updates = loadUpdates();
    const existingIds = new Set(
        updates.map(update => update.id)
    );

    let imported = 0;
    let skipped = 0;

    for (const update of oldUpdates) {
        if (!update.id || !update.version || !update.title || !update.date) {
            skipped++;
            continue;
        }

        if (existingIds.has(update.id)) {
            skipped++;
            continue;
        }

        updates.push({
            id: update.id,
            version: update.version,
            title: update.title,
            date: update.date,
            added: Array.isArray(update.added) ? update.added : [],
            improved: Array.isArray(update.improved) ? update.improved : [],
            fixed: Array.isArray(update.fixed) ? update.fixed : []
        });

        existingIds.add(update.id);
        imported++;
    }

    saveUpdates(updates);

    await message.reply(
        `✅ Old updates imported.\n\n` +
        `**Imported:** ${imported}\n` +
        `**Skipped:** ${skipped}\n\n` +
        `You can now delete \`oldupdates.json\`.`
    );

    return true;
}

    if (subcommand === "delete") {
        const id = args[2];

        if (!id) {
            await message.reply("❌ Usage: `MS!update delete <updateId>`");
            return true;
        }

        const updates = loadUpdates();
        const filtered = updates.filter(update => update.id !== id);

        if (filtered.length === updates.length) {
            await message.reply("❌ Update not found.");
            return true;
        }

        saveUpdates(filtered);

        await message.reply(
            `✅ Update \`${id}\` was deleted.`
        );

        return true;
    }

    if (subcommand === "cancel") {
        if (!sessions.has(message.author.id)) {
            await message.reply("❌ You do not have an active update creation session.");
            return true;
        }

        clearSession(message.author.id);

        await message.reply("❌ Update creation cancelled.");
        return true;
    }

    await message.reply("❌ Unknown subcommand.");
    return true;
}

module.exports = {
    handleUpdateAdmin
};
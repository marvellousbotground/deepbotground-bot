const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const {
    loadCustomCharacters,
    loadCustomLikes
} = require("../utils/customCharacters");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const ATTRIBUTE_EMOJIS = {
    push: "<:Push:1510718003661111556>",
    noti: "<:Noticeable:1510718001517822142>",
    coun: "<:Counter:1510717999458418718>",
    inv: "<:Vanish:1510717997713719478>",
    brut: "<:Brutality:1511496907007066262>",
    bruta: "<:Brutality:1511496907007066262>",
    area: "<:Area:1510717995914231949>",
    trans: "<:Transformation:1510717993959559209>",
    cine: "<:Cinema:1510717991908540466>",
    rng: "<:Rng:1510717989874307122>",
    heal: "<:Heal:1510717987794194502>",
    finish: "<:Finisher:1510717985818673293>",
    move: "<:Movement:1510717983700422694>",
    ex: "<:Explode:1510717981510860930>",
    grab: "<:Grab:1510717979115917454>",
    mele: "<:Mele:1510717976226300126>",

    range: "<:Range:1511468297445572618>",
    lr: "<:RangePlus:1511468293700059417>",
    lrp: "<:RangePlusPlus:1511468289946161192>",

    blind: "<:blindness:1511468288318636083>",
    charge: "<:charge:1511468284921253908>",
    tp: "<:Teleport:1511468300830376098>",

    break: "<:Break:1509366823236145162>",
    ignore: "<:Ignore:1509365768993771570>",
    block: "<:Block:1509363951874605219>"
};

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getAttributeEmojis(attack) {
    const rawAttributes =
        attack.attributes ||
        attack.atributes ||
        attack.attribute ||
        attack.atribute ||
        [];

    const attributes = Array.isArray(rawAttributes)
        ? rawAttributes
        : [rawAttributes];

    const emojis = attributes
        .map(attribute => ATTRIBUTE_EMOJIS[normalize(attribute)])
        .filter(Boolean);

    return emojis.length
        ? emojis.join(" ")
        : "None";
}

function getAttackIcon(attack, index) {
    if (attack.slot !== undefined && attack.slot !== null) {
        const slot = String(attack.slot).trim().toUpperCase();

        const slotIcons = {
            "1": "1️⃣",
            "2": "2️⃣",
            "3": "3️⃣",
            "4": "4️⃣",
            "5": "5️⃣",
            "6": "6️⃣",
            "7": "7️⃣",
            "8": "8️⃣",
            "9": "9️⃣",
            "E": "🇪"
        };

        return slotIcons[slot] || slot;
    }

    const numbers = [
        "1️⃣",
        "2️⃣",
        "3️⃣",
        "4️⃣",
        "5️⃣",
        "6️⃣",
        "7️⃣",
        "8️⃣",
        "9️⃣"
    ];

    return numbers[index] || `${index + 1}`;
}

function getExpiresAt(custom) {
    const base =
        custom.lastBoost ||
        custom.createdAt ||
        Math.floor(Date.now() / 1000);

    return base + THIRTY_DAYS;
}

function getTimeLeft(custom) {
    const expiresAt = getExpiresAt(custom);
    return `<t:${expiresAt}:R>`;
}

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("custom_select_action")
            .setPlaceholder("Select what you want to see")
            .addOptions(
                {
                    label: "Stats",
                    value: "stats"
                },
                {
                    label: "Attacks",
                    value: "attacks"
                },
                {
                    label: "Lore",
                    value: "lore"
                },
                {
                    label: "Skins",
                    value: "skins"
                },
                {
                    label: "Techs",
                    value: "techs"
                }
            )
    );
}

function createSkinSelect(custom, selectedSkin = null) {
    const options = [];

    if (selectedSkin) {
        options.push({
            label: "Default",
            description: "Return to the base custom character",
            value: "default"
        });
    }

    custom.skins.forEach((skin, index) => {
        if (selectedSkin && skin.name === selectedSkin.name) return;

        options.push({
            label: skin.name,
            value: String(index)
        });
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("custom_select_skin")
            .setPlaceholder("Select a skin")
            .addOptions(options.slice(0, 25))
    );
}

function createCustomStartEmbed(custom, likes, selectedSkin = null) {
    const title = selectedSkin
        ? `${custom.name} - ${selectedSkin.name}`
        : custom.name;

    const image = selectedSkin?.image || custom.image;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00ff99)
        .setDescription(
            `Select what you want to see.\n\n` +
            `**Custom ID:** \`${custom.id}\`\n` +
            `**Creator:** <@${custom.creator}>\n` +
            `**Likes:** ❤️ ${likes}\n` +
            `**Expires:** ${getTimeLeft(custom)}`
        )
        .setFooter({
            text: "Custom Character • MarvellousBOTground"
        });

    if (image && image.startsWith("http")) {
        embed.setImage(image);
    }

    if (selectedSkin) {
        embed.addFields({
            name: "Skin",
            value: selectedSkin.name
        });
    }

    return embed;
}

function createSkinsInfoEmbed(custom, selectedSkin = null) {
    const embed = new EmbedBuilder()
        .setTitle(`${custom.name} - Skins Information`)
        .setColor(0x2ecc71)
        .setFooter({
            text: "Custom Character • MarvellousBOTground"
        });

    if (!custom.skins || custom.skins.length === 0) {
        embed.setDescription("This custom character does not have any skins yet.");
        return embed;
    }

    const skinList = [];

    if (selectedSkin) {
        skinList.push("• Default");
    }

    custom.skins.forEach((skin, index) => {
        if (selectedSkin && skin.name === selectedSkin.name) return;

        skinList.push(`• Slot ${index + 1}: ${skin.name}`);
    });

    embed.setDescription(
        skinList.join("\n") +
        "\n\nSelect a skin from the menu below."
    );

    const image = selectedSkin?.image || custom.image;

    if (image && image.startsWith("http")) {
        embed.setThumbnail(image);
    }

    return embed;
}

function createCustomEmbed(custom, action, selectedSkin = null) {
    const colors = {
        attacks: 0xff0000,
        stats: 0x0099ff,
        lore: 0x9b59b6,
        skins: 0x2ecc71,
        techs: 0xf1c40f
    };

    if (action === "skins") {
        return createSkinsInfoEmbed(custom, selectedSkin);
    }

    const displayName = selectedSkin
        ? `${custom.name} - ${selectedSkin.name}`
        : custom.name;

    const image = selectedSkin?.image || custom.image;

    const embed = new EmbedBuilder()
        .setTitle(`${displayName} - ${action.toUpperCase()}`)
        .setColor(colors[action] || 0x2b2d31)
        .setFooter({
            text: "Custom Character • MarvellousBOTground"
        });

    if (image && image.startsWith("http")) {
        embed.setThumbnail(image);
    }

    if (action === "attacks") {
        if (!custom.attacks || custom.attacks.length === 0) {
            embed.setDescription("This custom character does not have any attacks registered yet.");
        } else {
            embed.setDescription(
                custom.attacks.map((attack, index) =>
                    `**${getAttackIcon(attack, index)} ${attack.name}**\n` +
                    `Damage: ${attack.damage}\n` +
                    `Cooldown: ${attack.cooldown}\n` +
                    `Attributes: ${getAttributeEmojis(attack)}`
                ).join("\n\n")
            );
        }
    }

    if (action === "stats") {
        const stats = custom.stats || {};

        embed.setDescription(
            `**HP:** ${stats.hp ?? stats["base hp"] ?? "Unknown"}\n` +
            `**Speed:** ${stats.speed ?? "Unknown"}\n` +
            `**Damage:** ${stats.damage ?? 5}\n` +
            `**Skills:** ${stats.skills ?? 0}\n` +
            `**Low HP Animation:** ${stats.lowHpAnimation ? "🟢" : "🔴"}\n` +
            `**Can Heal:** ${stats.canHeal ? "🟢" : "🔴"}`
        );
    }

    if (action === "lore") {
        embed.setDescription(
            selectedSkin?.lore ||
            custom.lore ||
            "No lore available."
        );
    }

    if (action === "techs") {
        if (!custom.techs || custom.techs.length === 0) {
            embed.setDescription("This custom character does not have any uploaded techs yet.");
        } else {
            embed.setDescription(
                custom.techs.map(tech =>
                    `**${tech.name}**\n${tech.video}\n\nVideo by: ${tech.credits}`
                ).join("\n\n")
            );
        }
    }

    return embed;
}

function createComponents(custom, currentAction, selectedSkin) {
    const components = [
        createActionSelect()
    ];

    if (
        currentAction === "skins" &&
        custom.skins &&
        custom.skins.length > 0
    ) {
        components.push(createSkinSelect(custom, selectedSkin));
    }

    return components;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("customchar")
        .setDescription("Custom character information")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Custom Character ID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const id = interaction.options
            .getString("id")
            .toUpperCase();

        const customs = loadCustomCharacters();
        const likesData = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            return interaction.reply({
                content: "Custom character not found.",
                ephemeral: true
            });
        }

        if (!Array.isArray(custom.attacks)) custom.attacks = [];
        if (!Array.isArray(custom.skins)) custom.skins = [];
        if (!Array.isArray(custom.techs)) custom.techs = [];

        const likes = likesData[id]?.likes || 0;

        let currentAction = null;
        let currentSkin = null;

        const message = await interaction.reply({
            embeds: [createCustomStartEmbed(custom, likes)],
            components: [createActionSelect()],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            time: 120000
        });

        collector.on("collect", async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "Only the person who used this command can interact with it.",
                    ephemeral: true
                });
            }

            if (i.customId === "custom_select_skin") {
                if (i.values[0] === "default") {
                    currentSkin = null;
                } else {
                    currentSkin = custom.skins[Number(i.values[0])];
                }

                return i.update({
                    embeds: [createCustomStartEmbed(custom, likes, currentSkin)],
                    components: [createActionSelect()]
                });
            }

            if (i.customId === "custom_select_action") {
                currentAction = i.values[0];

                return i.update({
                    embeds: [createCustomEmbed(custom, currentAction, currentSkin)],
                    components: createComponents(custom, currentAction, currentSkin)
                });
            }
        });

        collector.on("end", async () => {
            try {
                await interaction.editReply({
                    components: []
                });
            } catch (error) {}
        });
    }
};
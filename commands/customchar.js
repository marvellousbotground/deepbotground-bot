const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const {
    loadCustomCharacters,
    loadCustomLikes,
    saveCustomLikes
} = require("../utils/customCharacters");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const ATTRIBUTE_EMOJIS = {
    pasive: "<:Pasive:1521914059157405928>",
    clash: "<:Clash:1521913571041349863>",
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
    block: "<:Block:1509363951874605219>",

    lin: "<:Lingering:1517666297104699522>",
    pull: "<:Pull:1517666295133376562>",
    use: "<:Charges_use:1517666293052866701>"
};

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getDisplayName(custom, selectedSkin = null) {
    const star = custom.featured ? "⭐ " : "";

    return selectedSkin
        ? `${star}${custom.name} - ${selectedSkin.name}`
        : `${star}${custom.name}`;
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

    return emojis.length ? emojis.join(" ") : "None";
}

function getVisibleSlot(slot) {
    const value = String(slot || "").trim().toUpperCase();

    if (value === "EB") return "E";
    if (value.endsWith("B")) return value.replace("B", "");

    return value;
}

function getAttackIcon(attack, index) {
    const visibleSlot = getVisibleSlot(attack.slot);

    const slotIcons = {
        "1": "1️⃣",
        "2": "2️⃣",
        "3": "3️⃣",
        "4": "4️⃣",
        "5": "5️⃣",
        "E": "🇪"
    };

    if (visibleSlot && slotIcons[visibleSlot]) {
        return slotIcons[visibleSlot];
    }

    const numbers = [
        "1️⃣",
        "2️⃣",
        "3️⃣",
        "4️⃣",
        "5️⃣"
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

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("custom_select_action")
            .setPlaceholder("Select what you want to see")
            .addOptions(
                { label: "Stats", value: "stats" },
                { label: "Attacks", value: "attacks" },
                { label: "Lore", value: "lore" },
                { label: "Skins", value: "skins" }
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

function createLikeButton(likes) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("custom_like_button")
            .setLabel(`Like (${likes})`)
            .setEmoji("❤️")
            .setStyle(ButtonStyle.Secondary)
    );
}

function createCustomStartEmbed(custom, likes, selectedSkin = null) {
    const image = selectedSkin?.image || custom.image;
    const expiresAt = getExpiresAt(custom);

    const embed = new EmbedBuilder()
        .setTitle(getDisplayName(custom, selectedSkin))
        .setColor(custom.featured ? 0xf1c40f : 0x00ff99)
        .setDescription(
            `Select what you want to see.\n\n` +
            `**Custom ID:** \`${custom.id}\`\n` +
            `**Creator:** <@${custom.creator}>\n` +
            `**Likes:** ❤️ ${likes}\n` +
            `**Expires:** <t:${expiresAt}:R>\n` +
            `**Attacks:** ${custom.attacks?.length || 0}\n` +
            `**Skins:** ${custom.skins?.length || 0}`
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
        .setTitle(`${getDisplayName(custom)} - Skins Information`)
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

    custom.skins.forEach(skin => {
        if (selectedSkin && skin.name === selectedSkin.name) return;
        skinList.push(`• ${skin.name}`);
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
        skins: 0x2ecc71
    };

    if (action === "skins") {
        return createSkinsInfoEmbed(custom, selectedSkin);
    }

    const image = selectedSkin?.image || custom.image;

    const embed = new EmbedBuilder()
        .setTitle(`${getDisplayName(custom, selectedSkin)} - ${action.toUpperCase()}`)
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

    return embed;
}

function createComponents(custom, currentAction, selectedSkin, likes) {
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

    components.push(createLikeButton(likes));

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
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
        let likesData = loadCustomLikes();

        const custom = customs[id];

        if (!custom) {
            return interaction.reply({
                content: "Custom character not found.",
                ephemeral: true
            });
        }

        if (!Array.isArray(custom.attacks)) custom.attacks = [];
        if (!Array.isArray(custom.skins)) custom.skins = [];

        if (!likesData[id]) {
            likesData[id] = {
                likes: 0,
                users: [],
                featured: false
            };

            saveCustomLikes(likesData);
        }

        let likes = likesData[id].likes || 0;
        let currentAction = null;
        let currentSkin = null;

        const message = await interaction.reply({
            embeds: [createCustomStartEmbed(custom, likes)],
            components: createComponents(custom, currentAction, currentSkin, likes),
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

            if (i.customId === "custom_like_button") {
                likesData = loadCustomLikes();

                if (!likesData[id]) {
                    likesData[id] = {
                        likes: 0,
                        users: [],
                        featured: custom.featured || false
                    };
                }

                if (!Array.isArray(likesData[id].users)) {
                    likesData[id].users = [];
                }

                if (custom.creator === i.user.id) {
                    return i.reply({
                        content: "❌ You cannot like your own custom character.",
                        ephemeral: true
                    });
                }

                if (likesData[id].users.includes(i.user.id)) {
                    return i.reply({
                        content: "❌ You already liked this custom character.",
                        ephemeral: true
                    });
                }

                likesData[id].users.push(i.user.id);
                likesData[id].likes = likesData[id].users.length;

                saveCustomLikes(likesData);

                likes = likesData[id].likes;

                await i.reply({
                    content: "❤️ You liked this custom character!",
                    ephemeral: true
                });

                const embed = currentAction
                    ? createCustomEmbed(custom, currentAction, currentSkin)
                    : createCustomStartEmbed(custom, likes, currentSkin);

                await interaction.editReply({
                    embeds: [embed],
                    components: createComponents(custom, currentAction, currentSkin, likes)
                });

                return;
            }

            if (i.customId === "custom_select_skin") {
                if (i.values[0] === "default") {
                    currentSkin = null;
                } else {
                    currentSkin = custom.skins[Number(i.values[0])];
                }

                currentAction = null;

                return i.update({
                    embeds: [createCustomStartEmbed(custom, likes, currentSkin)],
                    components: createComponents(custom, currentAction, currentSkin, likes)
                });
            }

            if (i.customId === "custom_select_action") {
                currentAction = i.values[0];

                return i.update({
                    embeds: [createCustomEmbed(custom, currentAction, currentSkin)],
                    components: createComponents(custom, currentAction, currentSkin, likes)
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
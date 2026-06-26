const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data");

const ATTRIBUTE_EMOJIS = {
    boost: "<:Boost:1518480719431733456>",
    lin: "<:Lingering:1517666297104699522>",
    pull: "<:Pull:1517666295133376562>",
    use: "<:Charges_use:1517666293052866701>",

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

const attributeChoices = [
    { name: "Boost", value: "boost" },
    { name: "Lingering", value: "lin" },
    { name: "Pull", value: "pull" },
    { name: "Charges Use", value: "use" },

    { name: "Noticeable", value: "noti" },
    { name: "Vanish", value: "inv" },
    { name: "Area", value: "area" },
    { name: "Cinema", value: "cine" },
    { name: "Rng", value: "rng" },
    { name: "Blindness", value: "blind" },
    { name: "Push", value: "push" },

    { name: "Mele", value: "mele" },
    { name: "Range ++", value: "lrp" },
    { name: "Range +", value: "lr" },
    { name: "Range", value: "range" },
    { name: "Explode", value: "ex" },
    { name: "Grab", value: "grab" },

    { name: "Break", value: "break" },
    { name: "Ignore", value: "ignore" },
    { name: "Block", value: "block" },

    { name: "Movement", value: "move" },
    { name: "Teleport", value: "tp" },

    { name: "Heal", value: "heal" },
    { name: "Charge", value: "charge" },
    { name: "Transformation", value: "trans" },

    { name: "Brutality", value: "bruta" },
    { name: "Finisher", value: "finish" },
    { name: "Counter", value: "coun" }
];

const ATTRIBUTE_NAMES = Object.fromEntries(
    attributeChoices.map(attribute => [attribute.value, attribute.name])
);

const attributeAliases = {
    ranged: "range",
    range: "range",

    longrange: "lr",
    longrangeplus: "lr",
    rangeplus: "lr",
    lr: "lr",

    longrangeplusplus: "lrp",
    rangeplusplus: "lrp",
    lrp: "lrp",

    explode: "ex",
    explosive: "ex",
    ex: "ex",

    teleport: "tp",
    teleportation: "tp",
    tele: "tp",
    tp: "tp",

    transformation: "trans",
    transform: "trans",
    trans: "trans",

    finisher: "finish",
    finish: "finish",

    counter: "coun",
    coun: "coun",

    shieldbreak: "break",
    break: "break",

    shieldignore: "ignore",
    ignore: "ignore",

    shieldblock: "block",
    block: "block",

    melee: "mele",
    mele: "mele",

    movement: "move",
    mobility: "move",
    move: "move",

    chargesuse: "use",
    chargeuse: "use",
    use: "use",

    charge: "charge",

    lingering: "lin",
    lin: "lin",

    boost: "boost",
    pull: "pull",

    blindness: "blind",
    blind: "blind",

    noticeable: "noti",
    noti: "noti",

    vanish: "inv",
    invisible: "inv",
    invisibility: "inv",
    inv: "inv",

    brutality: "bruta",
    brutal: "bruta",
    brut: "bruta",
    bruta: "bruta",

    cinema: "cine",
    cinematic: "cine",
    cine: "cine",

    rng: "rng",
    heal: "heal",
    grab: "grab",
    area: "area",
    aoe: "area",
    push: "push"
};

const universes = [
    "Invincible",
    "Marvel",
    "The Boys",
    "DC",
    "Star Wars",
    "Scream",
    "Dexter",
    "My Hero Academia",
    "Stranger Things",
    "Attack on Titan",
    "FNAF",
    "Squid Game",
    "Companion",
    "Creepypastas",
    "YOU",
    "Death Note",
    "God of War",
    "One Piece",
    "Real Life",
    "Halloween",
    "American Psycho",
    "Dune",
    "IT",
    "Pibby",
    "Rambo",
    "SCP Foundation",
    "Sonic",
    "Minecraft",
    "American Horror Story",
    "Breaking Bad"
];

function normalizeKey(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function normalizeAttribute(attribute) {
    const key = normalizeKey(attribute);
    return attributeAliases[key] || key;
}

function getAttackAttributes(attack) {
    return (attack.attributes || [])
        .map(normalizeAttribute)
        .filter(Boolean);
}

function isSlotFive(attack) {
    return String(attack.slot).toLowerCase() === "5";
}

function attackMatchesAttribute(attack, attribute) {
    const normalizedAttribute = normalizeAttribute(attribute);
    const attackAttributes = getAttackAttributes(attack);

    if (normalizedAttribute === "heal" && isSlotFive(attack)) {
        return false;
    }

    return attackAttributes.includes(normalizedAttribute);
}

function characterMatchesAttributes(character, attributes) {
    if (!attributes.length) return true;

    const attacks = character.attacks || [];

    return attributes.every(attribute =>
        attacks.some(attack => attackMatchesAttribute(attack, attribute))
    );
}

function characterOrVersionMatches(character, attributes) {
    if (!attributes.length) return true;

    if (Array.isArray(character.versions) && character.versions.length > 0) {
        return character.versions.some(version =>
            characterMatchesAttributes(version, attributes)
        );
    }

    return characterMatchesAttributes(character, attributes);
}

function formatAttributes(attack) {
    const attributes = getAttackAttributes(attack);

    if (!attributes.length) {
        return "None";
    }

    return attributes
        .map(attribute =>
            ATTRIBUTE_EMOJIS[attribute] ||
            ATTRIBUTE_NAMES[attribute] ||
            attribute
        )
        .join(" ");
}

function formatSkin(skin) {
    if (typeof skin === "string") {
        return `• ${skin}`;
    }

    if (!skin) {
        return "• Unknown Skin";
    }

    return `• ${skin.name || "Unknown Skin"}`;
}

function safeText(value, fallback = "Unknown") {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    return String(value);
}

function loadCharacters() {
    const files = fs.readdirSync(DATA_PATH, {
        withFileTypes: true
    });

    const characters = [];

    for (const file of files) {
        if (!file.isFile()) continue;
        if (!file.name.toLowerCase().endsWith(".json")) continue;

        const filePath = path.join(DATA_PATH, file.name);

        try {
            delete require.cache[require.resolve(filePath)];

            const character = require(filePath);

            if (!character || !character.name) continue;

            characters.push(character);

        } catch (error) {
            console.log(`Error loading character file ${file.name}:`, error.message);
        }
    }

    return characters;
}

function createCharacterEmbed(character, action) {
    const colors = {
        attacks: 0xff0000,
        stats: 0x0099ff,
        lore: 0x9b59b6,
        skins: 0x2ecc71,
        techs: 0xf1c40f
    };

    const embed = new EmbedBuilder()
        .setTitle(`${character.name} - ${action.toUpperCase()}`)
        .setColor(colors[action] || 0x00ff99)
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (character.image) {
        embed.setThumbnail(character.image);
    }

    if (action === "attacks") {
        const attacks = character.attacks || [];

        if (!attacks.length) {
            embed.setDescription("This character does not have attacks registered.");
            return embed;
        }

        embed.setDescription(
            attacks.map(attack =>
                `**${attack.slot ? `${attack.slot}. ` : ""}${attack.name}**\n` +
                `Damage: ${safeText(attack.damage, "0")}\n` +
                `Cooldown: ${safeText(attack.cooldown, "0s")}\n` +
                `Attributes: ${formatAttributes(attack)}`
            ).join("\n\n").slice(0, 4096)
        );
    }

    if (action === "stats") {
        const stats = character.stats || {};

        embed.setDescription(
            `**HP:** ${stats.hp || stats["base hp"] || "Unknown"}\n` +
            `**Speed:** ${stats.speed || "Unknown"}\n` +
            `**Damage:** ${stats.damage ?? "Unknown"}\n` +
            `**Skills:** ${stats.skills ?? "Unknown"}\n` +
            `**Low HP Animation:** ${stats.lowHpAnimation ? "🟢" : "🔴"}\n` +
            `**Can Heal:** ${stats.canHeal ? "🟢" : "🔴"}`
        );
    }

    if (action === "lore") {
        embed.setDescription(character.lore || "No lore available.");
    }

    if (action === "skins") {
        if (!character.skins || character.skins.length === 0) {
            embed.setDescription("This character does not have any skins yet.");
        } else {
            embed.setDescription(character.skins.map(formatSkin).join("\n").slice(0, 4096));
        }
    }

    if (action === "techs") {
        if (!character.techs || character.techs.length === 0) {
            embed.setDescription("This character does not have any uploaded techs yet.");
        } else {
            embed.setDescription(
                character.techs.map(tech =>
                    `**${tech.name}**\n${tech.video}\n\nVideo by: ${tech.credits}`
                ).join("\n\n").slice(0, 4096)
            );
        }
    }

    return embed;
}

function createStartEmbed(character) {
    const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setColor(0x00ff99)
        .setDescription("Select what information you want to see.")
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (character.image) {
        embed.setImage(character.image);
    }

    return embed;
}

function createVersionStartEmbed(character) {
    const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setColor(0x00ff99)
        .setDescription(`Select ${character.name} version.`)
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (character.image) {
        embed.setImage(character.image);
    }

    return embed;
}

function createVersionSelect(character) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("search_select_version")
            .setPlaceholder(`Select ${character.name} version`)
            .addOptions(
                character.versions.slice(0, 25).map(version => ({
                    label: version.name.slice(0, 100),
                    value: version.id.slice(0, 100)
                }))
            )
    );
}

function createSearchEmbed(results, page) {
    const start = page * 9;
    const current = results.slice(start, start + 9);
    const totalPages = Math.max(Math.ceil(results.length / 9), 1);

    return new EmbedBuilder()
        .setTitle("Search Results")
        .setColor(0x00ff99)
        .setDescription(
            current.map((character, index) =>
                `**${start + index + 1}. ${character.name}**\n> ${character.universe || "Unknown universe"}`
            ).join("\n\n")
        )
        .setFooter({
            text: `Page ${page + 1}/${totalPages} • MarvellousBOTground`
        });
}

function createPageButtons(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("search_prev")
            .setLabel("Previous Page")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),

        new ButtonBuilder()
            .setCustomId("search_next")
            .setLabel("Next Page")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
    );
}

function createCharacterSelect(results, page) {
    const start = page * 9;
    const current = results.slice(start, start + 9);

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("search_select_character")
            .setPlaceholder("Select a character")
            .addOptions(
                current.map((character, index) => ({
                    label: character.name.slice(0, 100),
                    description: (character.universe || "Unknown universe").slice(0, 100),
                    value: String(start + index)
                }))
            )
    );
}

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("search_select_action")
            .setPlaceholder("Select what you want to see")
            .addOptions(
                { label: "Stats", value: "stats" },
                { label: "Attacks", value: "attacks" },
                { label: "Lore", value: "lore" },
                { label: "Skins", value: "skins" },
                { label: "Techs", value: "techs" }
            )
    );
}

function getComponentsForCurrentState(selectedCharacter) {
    if (selectedCharacter?.versions?.length > 0) {
        return [
            createVersionSelect(selectedCharacter),
            createActionSelect()
        ];
    }

    return [createActionSelect()];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search characters by universe or attack attributes")

        .addStringOption(option =>
            option
                .setName("attribute1")
                .setDescription("Optional attribute")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("attribute2")
                .setDescription("Optional attribute")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("attribute3")
                .setDescription("Optional attribute")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("attribute4")
                .setDescription("Optional attribute")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("universe")
                .setDescription("Optional universe")
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = String(focusedOption.value || "").toLowerCase();

        if (
            focusedOption.name === "attribute1" ||
            focusedOption.name === "attribute2" ||
            focusedOption.name === "attribute3" ||
            focusedOption.name === "attribute4"
        ) {
            const filtered = attributeChoices
                .filter(attribute =>
                    attribute.name.toLowerCase().includes(focusedValue) ||
                    attribute.value.toLowerCase().includes(focusedValue)
                )
                .slice(0, 25);

            return interaction.respond(
                filtered.map(attribute => ({
                    name: attribute.name,
                    value: attribute.value
                }))
            );
        }

        if (focusedOption.name === "universe") {
            const filtered = universes
                .filter(universe =>
                    universe.toLowerCase().includes(focusedValue)
                )
                .slice(0, 25);

            return interaction.respond(
                filtered.map(universe => ({
                    name: universe,
                    value: universe
                }))
            );
        }

        return interaction.respond([]);
    },

    async execute(interaction) {
        const universe = interaction.options.getString("universe");

        const attributes = [
            interaction.options.getString("attribute1"),
            interaction.options.getString("attribute2"),
            interaction.options.getString("attribute3"),
            interaction.options.getString("attribute4")
        ].filter(Boolean).map(normalizeAttribute);

        const results = loadCharacters().filter(character => {
            const matchesUniverse = universe
                ? character.universe === universe
                : true;

            const matchesAttributes = characterOrVersionMatches(
                character,
                attributes
            );

            return matchesUniverse && matchesAttributes;
        });

        if (results.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Search Results")
                        .setColor(0xff0000)
                        .setDescription("No characters found with those filters.")
                        .setFooter({
                            text: "MarvellousBOTground"
                        })
                ]
            });
        }

        let page = 0;
        let selectedCharacter = null;
        let currentVersion = null;
        let currentAction = null;

        const totalPages = Math.ceil(results.length / 9);

        async function openCharacter(i, character) {
            selectedCharacter = character;
            currentVersion = null;
            currentAction = null;

            if (selectedCharacter.versions?.length > 0) {
                return i.update({
                    embeds: [createVersionStartEmbed(selectedCharacter)],
                    components: [createVersionSelect(selectedCharacter)]
                });
            }

            return i.update({
                embeds: [createStartEmbed(selectedCharacter)],
                components: [createActionSelect()]
            });
        }

        if (results.length === 1) {
            selectedCharacter = results[0];

            const startEmbed = selectedCharacter.versions?.length > 0
                ? createVersionStartEmbed(selectedCharacter)
                : createStartEmbed(selectedCharacter);

            const startComponents = selectedCharacter.versions?.length > 0
                ? [createVersionSelect(selectedCharacter)]
                : [createActionSelect()];

            const message = await interaction.reply({
                embeds: [startEmbed],
                components: startComponents,
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

                if (i.customId === "search_select_version") {
                    currentVersion = selectedCharacter.versions.find(
                        version => version.id === i.values[0]
                    );

                    if (!currentVersion) {
                        return i.reply({
                            content: "Version not found.",
                            ephemeral: true
                        });
                    }

                    if (currentAction) {
                        return i.update({
                            embeds: [createCharacterEmbed(currentVersion, currentAction)],
                            components: getComponentsForCurrentState(selectedCharacter)
                        });
                    }

                    return i.update({
                        embeds: [createStartEmbed(currentVersion)],
                        components: getComponentsForCurrentState(selectedCharacter)
                    });
                }

                if (i.customId === "search_select_action") {
                    currentAction = i.values[0];

                    if (selectedCharacter.versions?.length > 0 && !currentVersion) {
                        return i.reply({
                            content: "Select a version first.",
                            ephemeral: true
                        });
                    }

                    const targetCharacter = currentVersion || selectedCharacter;

                    return i.update({
                        embeds: [createCharacterEmbed(targetCharacter, currentAction)],
                        components: getComponentsForCurrentState(selectedCharacter)
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

            return;
        }

        const message = await interaction.reply({
            embeds: [createSearchEmbed(results, page)],
            components: [
                createCharacterSelect(results, page),
                createPageButtons(page, totalPages)
            ],
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

            if (i.customId === "search_prev") {
                page--;

                return i.update({
                    embeds: [createSearchEmbed(results, page)],
                    components: [
                        createCharacterSelect(results, page),
                        createPageButtons(page, totalPages)
                    ]
                });
            }

            if (i.customId === "search_next") {
                page++;

                return i.update({
                    embeds: [createSearchEmbed(results, page)],
                    components: [
                        createCharacterSelect(results, page),
                        createPageButtons(page, totalPages)
                    ]
                });
            }

            if (i.customId === "search_select_character") {
                const index = Number(i.values[0]);
                return openCharacter(i, results[index]);
            }

            if (i.customId === "search_select_version") {
                if (!selectedCharacter?.versions?.length) {
                    return i.reply({
                        content: "No version available.",
                        ephemeral: true
                    });
                }

                currentVersion = selectedCharacter.versions.find(
                    version => version.id === i.values[0]
                );

                if (!currentVersion) {
                    return i.reply({
                        content: "Version not found.",
                        ephemeral: true
                    });
                }

                if (currentAction) {
                    return i.update({
                        embeds: [createCharacterEmbed(currentVersion, currentAction)],
                        components: getComponentsForCurrentState(selectedCharacter)
                    });
                }

                return i.update({
                    embeds: [createStartEmbed(currentVersion)],
                    components: getComponentsForCurrentState(selectedCharacter)
                });
            }

            if (i.customId === "search_select_action") {
                if (!selectedCharacter) {
                    return i.reply({
                        content: "No character selected.",
                        ephemeral: true
                    });
                }

                currentAction = i.values[0];

                if (selectedCharacter.versions?.length > 0 && !currentVersion) {
                    return i.reply({
                        content: "Select a version first.",
                        ephemeral: true
                    });
                }

                const targetCharacter = currentVersion || selectedCharacter;

                return i.update({
                    embeds: [createCharacterEmbed(targetCharacter, currentAction)],
                    components: getComponentsForCurrentState(selectedCharacter)
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
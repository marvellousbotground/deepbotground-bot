const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data");
function getSkinDataFolderPath() {
    const possibleFolders = [
        "skinData",
        "SkinData",
        "skindata",
        "SKINDATA"
    ];

    for (const folder of possibleFolders) {
        const folderPath = path.join(DATA_PATH, folder);

        if (fs.existsSync(folderPath)) {
            return folderPath;
        }
    }

    return path.join(DATA_PATH, "SkinData");
}

const SKIN_DATA_PATH = getSkinDataFolderPath();

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

const ATTRIBUTE_ALIASES = {
    boost: "boost",

    lingering: "lin",
    lin: "lin",

    pull: "pull",

    use: "use",
    chargeuse: "use",
    chargesuse: "use",
    charges_use: "use",

    push: "push",

    noticeable: "noti",
    noti: "noti",

    counter: "coun",
    coun: "coun",

    vanish: "inv",
    invisible: "inv",
    invisibility: "inv",
    invis: "inv",
    inv: "inv",

    brutality: "bruta",
    brutal: "bruta",
    brut: "bruta",
    bruta: "bruta",

    area: "area",
    aoe: "area",

    transformation: "trans",
    transform: "trans",
    trans: "trans",

    cinema: "cine",
    cinematic: "cine",
    cine: "cine",

    rng: "rng",

    heal: "heal",

    finisher: "finish",
    finish: "finish",

    movement: "move",
    mobility: "move",
    move: "move",

    explode: "ex",
    explosive: "ex",
    ex: "ex",

    grab: "grab",

    melee: "mele",
    mele: "mele",

    ranged: "range",
    range: "range",

    longrange: "lr",
    rangeplus: "lr",
    longrangeplus: "lr",
    lr: "lr",

    rangeplusplus: "lrp",
    longrangeplusplus: "lrp",
    lrp: "lrp",

    blindness: "blind",
    blind: "blind",

    charge: "charge",

    teleport: "tp",
    teleportation: "tp",
    tele: "tp",
    tp: "tp",

    shieldbreak: "break",
    break: "break",

    shieldignore: "ignore",
    ignore: "ignore",

    shieldblock: "block",
    block: "block"
};

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function normalizeAttribute(attribute) {
    const key = normalize(attribute);
    return ATTRIBUTE_ALIASES[key] || key;
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
        .map(attribute => normalizeAttribute(attribute))
        .map(attribute => ATTRIBUTE_EMOJIS[attribute])
        .filter(Boolean);

    return emojis.length
        ? emojis.join(" ")
        : "None";
}

function getVisibleSlot(slot) {
    const value = String(slot || "").trim().toUpperCase();

    if (value === "EB") return "E";
    if (value.endsWith("B")) return value.replace("B", "");

    return value;
}

function getAttackIcon(attack, index) {
    if (attack.slot !== undefined && attack.slot !== null) {
        const slot = getVisibleSlot(attack.slot);

        const slotIcons = {
            "1": "1️⃣",
            "2": "2️⃣",
            "3": "3️⃣",
            "4": "4️⃣",
            "5": "5️⃣",
            "E": "🇪"
        };

        return slotIcons[slot] || slot;
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

function getAllCharacters() {
    if (!fs.existsSync(DATA_PATH)) {
        return [];
    }

    const files = fs
        .readdirSync(DATA_PATH, {
            withFileTypes: true
        })
        .filter(file =>
            file.isFile() &&
            file.name.toLowerCase().endsWith(".json")
        );

    const characters = [];

    for (const file of files) {
        try {
            const fullPath = path.join(DATA_PATH, file.name);

            delete require.cache[require.resolve(fullPath)];

            const data = require(fullPath);

            if (!data || !data.name) continue;

            characters.push({
                file: file.name,
                key: file.name.replace(/\.json$/i, ""),
                data
            });
        } catch (error) {
            console.log(`Error loading ${file.name}:`, error.message);
        }
    }

    return characters;
}

function getSkinDataFileName(selectedSkin) {
    if (!selectedSkin) return null;

    return (
        selectedSkin.dataFile ||
        selectedSkin.datafile ||
        selectedSkin.data ||
        selectedSkin.file ||
        selectedSkin.skinData ||
        null
    );
}

function loadSkinData(dataFile) {
    if (!dataFile) return {};

    const cleanFile = String(dataFile).trim();
    const baseName = path.basename(cleanFile);
    const wantedFile = baseName.toLowerCase().endsWith(".json")
        ? baseName
        : `${baseName}.json`;

    const possiblePaths = [
        path.join(SKIN_DATA_PATH, cleanFile),
        path.join(SKIN_DATA_PATH, wantedFile)
    ];

    if (fs.existsSync(SKIN_DATA_PATH)) {
        const files = fs.readdirSync(SKIN_DATA_PATH);

        const foundFile = files.find(file =>
            file.toLowerCase() === wantedFile.toLowerCase()
        );

        if (foundFile) {
            possiblePaths.unshift(
                path.join(SKIN_DATA_PATH, foundFile)
            );
        }
    }

    for (const skinDataPath of possiblePaths) {
        try {
            if (!fs.existsSync(skinDataPath)) continue;

            delete require.cache[require.resolve(skinDataPath)];

            return require(skinDataPath);
        } catch (error) {
            console.log(`Error loading skin data ${dataFile}:`, error.message);
        }
    }

    console.log(`Skin data file not found: ${dataFile}`);
    return {};
}

function mergeSkinData(characterData, selectedSkin = null) {
    if (!selectedSkin) return characterData;

    const dataFile = getSkinDataFileName(selectedSkin);
    const extraData = loadSkinData(dataFile);

    return {
        ...characterData,
        ...extraData,

        name: characterData.name,

        image:
            selectedSkin.image ||
            extraData.image ||
            characterData.image,

        lore:
            selectedSkin.lore ||
            extraData.lore ||
            characterData.lore,

        skins:
            characterData.skins || []
    };
}

function findCharacter(input) {
    const query = normalize(input);
    const characters = getAllCharacters();

    return characters.find(character => {
        const name = normalize(character.data.name);
        const key = normalize(character.key);
        const aliases = character.data.aliases || [];

        return (
            name === query ||
            key === query ||
            aliases.some(alias => normalize(alias) === query)
        );
    });
}

function hasAdvancedSkins(characterData) {
    return (
        Array.isArray(characterData.skins) &&
        characterData.skins.length > 0 &&
        typeof characterData.skins[0] === "object"
    );
}

function getSkinByName(characterData, skinName) {
    if (!skinName || !Array.isArray(characterData?.skins)) return null;

    return characterData.skins.find(
        skin => skin.name === skinName
    ) || null;
}

function createVersionSelect(character) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("char_select_version")
            .setPlaceholder(`Select ${character.name} version`)
            .addOptions(
                character.versions.slice(0, 25).map(version => ({
                    label: version.name.slice(0, 100),
                    value: version.id.slice(0, 100)
                }))
            )
    );
}

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("char_select_action")
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

function createSkinSelect(characterData, selectedSkin = null) {
    const options = [];

    if (selectedSkin) {
        options.push({
            label: "Default",
            description: "Return to the base character",
            value: "default"
        });
    }

    characterData.skins.forEach((skin, index) => {
        if (selectedSkin && skin.name === selectedSkin.name) return;

        options.push({
            label: skin.name.slice(0, 100),
            value: String(index)
        });
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("char_select_skin")
            .setPlaceholder("Select a skin")
            .addOptions(options.slice(0, 25))
    );
}

function createCharacterStartEmbed(characterData, selectedSkin = null) {
    const title = selectedSkin
        ? `${characterData.name} - ${selectedSkin.name}`
        : characterData.name;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00ff99)
        .setDescription("Select what you want to see.")
        .setFooter({
            text: "MarvellousBOTground"
        });

    const image = selectedSkin?.image || characterData.image;

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

function createSkinsInfoEmbed(characterData, selectedSkin = null) {
    const embed = new EmbedBuilder()
        .setTitle(`${characterData.name} - Skins Information`)
        .setColor(0x2ecc71)
        .setFooter({
            text: "MarvellousBOTground"
        });

    if (!characterData.skins || characterData.skins.length === 0) {
        embed.setDescription("This character does not have any skins yet.");
        return embed;
    }

    if (!hasAdvancedSkins(characterData)) {
        embed.setDescription(
            characterData.skins.map(skin => `• ${skin}`).join("\n")
        );

        return embed;
    }

    const skinList = [];

    if (selectedSkin) {
        skinList.push("• Default");
    }

    characterData.skins.forEach(skin => {
        if (selectedSkin && skin.name === selectedSkin.name) return;

        skinList.push(`• ${skin.name}`);
    });

    embed.setDescription(
        skinList.join("\n") +
        "\n\nSelect a skin from the menu below."
    );

    const image = selectedSkin?.image || characterData.image;

    if (image && image.startsWith("http")) {
        embed.setThumbnail(image);
    }

    return embed;
}

function createCharacterEmbed(characterData, action, selectedSkin = null) {
    const colors = {
        attacks: 0xff0000,
        stats: 0x0099ff,
        lore: 0x9b59b6,
        skins: 0x2ecc71,
        techs: 0xf1c40f
    };

    if (action === "skins") {
        return createSkinsInfoEmbed(characterData, selectedSkin);
    }

    const gameplayData = mergeSkinData(characterData, selectedSkin);

    const displayName = selectedSkin
        ? `${characterData.name} - ${selectedSkin.name}`
        : characterData.name;

    const embed = new EmbedBuilder()
        .setTitle(`${displayName} - ${action.toUpperCase()}`)
        .setColor(colors[action] || 0x00ff99)
        .setFooter({
            text: "MarvellousBOTground"
        });

    const image = selectedSkin?.image || gameplayData.image || characterData.image;

    if (image && image.startsWith("http")) {
        embed.setThumbnail(image);
    }

    if (action === "attacks") {
        if (!gameplayData.attacks || gameplayData.attacks.length === 0) {
            embed.setDescription(
                "This character does not have any attacks registered yet."
            );
        } else {
            embed.setDescription(
                gameplayData.attacks.map((attack, index) =>
                    `**${getAttackIcon(attack, index)} ${attack.name}**\n` +
                    `Damage: ${attack.damage ?? 0}\n` +
                    `Cooldown: ${attack.cooldown || "0s"}\n` +
                    `Attributes: ${getAttributeEmojis(attack)}`
                ).join("\n\n").slice(0, 4096)
            );
        }
    }

    if (action === "stats") {
        const stats = gameplayData.stats || {};

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
        embed.setDescription(
            gameplayData.lore ||
            selectedSkin?.lore ||
            characterData.lore ||
            "No lore available."
        );
    }

    if (action === "techs") {
        if (!gameplayData.techs || gameplayData.techs.length === 0) {
            embed.setDescription(
                "This character does not have any uploaded techs yet."
            );
        } else {
            embed.setDescription(
                gameplayData.techs.map(tech =>
                    `**${tech.name}**\n${tech.video}\n\nVideo by: ${tech.credits}`
                ).join("\n\n").slice(0, 4096)
            );
        }
    }

    return embed;
}

function createComponents(characterData, currentAction, selectedSkin, extraRows = []) {
    const components = [
        ...extraRows,
        createActionSelect()
    ];

    if (
        currentAction === "skins" &&
        hasAdvancedSkins(characterData)
    ) {
        components.push(
            createSkinSelect(
                characterData,
                selectedSkin
            )
        );
    }

    return components;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("char")
        .setDescription("Character information")
        .addStringOption(option =>
            option
                .setName("character")
                .setDescription("Select a character")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        try {
            const focusedValue = normalize(
                interaction.options.getFocused()
            );

            const characters = getAllCharacters();

            const scored = characters
                .map(character => {
                    const name = normalize(character.data.name);
                    const key = normalize(character.key);
                    const aliases = character.data.aliases || [];

                    const allNames = [
                        name,
                        key,
                        ...aliases.map(alias => normalize(alias))
                    ];

                    let score = 999;

                    if (allNames.some(n => n === focusedValue)) {
                        score = 0;
                    } else if (allNames.some(n => n.startsWith(focusedValue))) {
                        score = 1;
                    } else if (allNames.some(n => n.includes(focusedValue))) {
                        score = 2;
                    }

                    return {
                        character,
                        score
                    };
                })
                .filter(item => item.score !== 999)
                .sort((a, b) => a.score - b.score)
                .slice(0, 25);

            await interaction.respond(
                scored.map(item => ({
                    name: item.character.data.name,
                    value: item.character.key
                }))
            );
        } catch (error) {
            console.log("Autocomplete error:", error);
        }
    },

    async execute(interaction) {
        const characterInput = interaction.options.getString("character");
        const found = findCharacter(characterInput);

        if (!found) {
            return interaction.reply({
                content: "Character not found.",
                ephemeral: true
            });
        }

        const character = found.data;

        let currentVersion = null;
        let currentAction = null;
        let currentSkin = null;

        if (character.versions?.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle(character.name)
                .setColor(0x00ff99)
                .setDescription(`Select ${character.name} version`)
                .setFooter({
                    text: "MarvellousBOTground"
                });

            if (character.image && character.image.startsWith("http")) {
                embed.setImage(character.image);
            }

            const message = await interaction.reply({
                embeds: [embed],
                components: [
                    createVersionSelect(character)
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

                if (i.customId === "char_select_version") {
                    const previousSkinName = currentSkin?.name;

                    currentVersion = character.versions.find(
                        version => version.id === i.values[0]
                    );

                    if (!currentVersion) {
                        return i.reply({
                            content: "Version not found.",
                            ephemeral: true
                        });
                    }

                    currentSkin = previousSkinName
                        ? getSkinByName(currentVersion, previousSkinName)
                        : null;

                    if (currentAction) {
                        return i.update({
                            embeds: [
                                createCharacterEmbed(
                                    currentVersion,
                                    currentAction,
                                    currentSkin
                                )
                            ],
                            components: createComponents(
                                currentVersion,
                                currentAction,
                                currentSkin,
                                [
                                    createVersionSelect(character)
                                ]
                            )
                        });
                    }

                    return i.update({
                        embeds: [
                            createCharacterStartEmbed(
                                currentVersion,
                                currentSkin
                            )
                        ],
                        components: [
                            createVersionSelect(character),
                            createActionSelect()
                        ]
                    });
                }

                if (i.customId === "char_select_skin") {
                    if (!currentVersion) {
                        return i.reply({
                            content: "Select a version first.",
                            ephemeral: true
                        });
                    }

                    if (i.values[0] === "default") {
                        currentSkin = null;
                    } else {
                        currentSkin =
                            currentVersion.skins[
                                Number(i.values[0])
                            ];
                    }

                    return i.update({
                        embeds: [
                            createCharacterEmbed(
                                currentVersion,
                                currentAction || "skins",
                                currentSkin
                            )
                        ],
                        components: createComponents(
                            currentVersion,
                            currentAction || "skins",
                            currentSkin,
                            [
                                createVersionSelect(character)
                            ]
                        )
                    });
                }

                if (i.customId === "char_select_action") {
                    if (!currentVersion) {
                        return i.reply({
                            content: "Select a version first.",
                            ephemeral: true
                        });
                    }

                    currentAction = i.values[0];

                    return i.update({
                        embeds: [
                            createCharacterEmbed(
                                currentVersion,
                                currentAction,
                                currentSkin
                            )
                        ],
                        components: createComponents(
                            currentVersion,
                            currentAction,
                            currentSkin,
                            [
                                createVersionSelect(character)
                            ]
                        )
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
            embeds: [
                createCharacterStartEmbed(character)
            ],
            components: [
                createActionSelect()
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

            if (i.customId === "char_select_skin") {
                if (i.values[0] === "default") {
                    currentSkin = null;
                } else {
                    currentSkin =
                        character.skins[
                            Number(i.values[0])
                        ];
                }

                return i.update({
                    embeds: [
                        createCharacterEmbed(
                            character,
                            currentAction || "skins",
                            currentSkin
                        )
                    ],
                    components: createComponents(
                        character,
                        currentAction || "skins",
                        currentSkin
                    )
                });
            }

            if (i.customId === "char_select_action") {
                currentAction = i.values[0];

                return i.update({
                    embeds: [
                        createCharacterEmbed(
                            character,
                            currentAction,
                            currentSkin
                        )
                    ],
                    components: createComponents(
                        character,
                        currentAction,
                        currentSkin
                    )
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
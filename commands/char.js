const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const ATTRIBUTE_EMOJIS = {
    
    lin: "<:Lingering:1517666297104699522>",
    pull: "<:Pull:1517666295133376562>",
    use: "<:Charges_use:1517666293052866701>",
    push: "<:Push:1510718003661111556>",
    noti: "<:Noticeable:1510718001517822142>",
    coun: "<:Counter:1510717999458418718>",
    inv: "<:Vanish:1510717997713719478>",
    brut: "<:Brutality:1511496907007066262>",
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
    bruta: "<:Brutality:1511496907007066262>",

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
    return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
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
        ? emojis.join(' ')
        : 'None';
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
    const dataPath = path.join(__dirname, '..', 'data');
    const files = fs.readdirSync(dataPath).filter(file => file.toLowerCase().endsWith('.json'));
    const characters = [];

    for (const file of files) {
        try {
            const fullPath = path.join(dataPath, file);
            delete require.cache[require.resolve(fullPath)];
            const data = require(fullPath);

            characters.push({
                file,
                key: file.replace(/\.json$/i, ''),
                data
            });
        } catch (error) {
            console.log(`Error loading ${file}:`, error.message);
        }
    }

    return characters;
}

function loadSkinData(dataFile) {
    if (!dataFile) return {};

    try {
        const skinDataPath = path.join(__dirname, '..', 'data', 'skinData', dataFile);

        delete require.cache[require.resolve(skinDataPath)];

        return require(skinDataPath);
    } catch (error) {
        console.log(`Error loading skin data ${dataFile}:`, error.message);
        return {};
    }
}

function mergeSkinData(characterData, selectedSkin = null) {
    if (!selectedSkin) return characterData;

    const extraData = loadSkinData(selectedSkin.dataFile);

    return {
        ...characterData,
        ...extraData,
        name: characterData.name,
        image: selectedSkin.image || characterData.image,
        lore: selectedSkin.lore || characterData.lore
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
        characterData.skins &&
        characterData.skins.length > 0 &&
        typeof characterData.skins[0] === 'object'
    );
}

function createVersionSelect(character) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('char_select_version')
            .setPlaceholder(`Select ${character.name} version`)
            .addOptions(
                character.versions.map(version => ({
                    label: version.name,
                    value: version.id
                }))
            )
    );
}

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('char_select_action')
            .setPlaceholder('Select what you want to see')
            .addOptions(
                { label: 'Stats', value: 'stats' },
                { label: 'Attacks', value: 'attacks' },
                { label: 'Lore', value: 'lore' },
                { label: 'Skins', value: 'skins' },
                { label: 'Techs', value: 'techs' }
            )
    );
}

function createSkinSelect(characterData, selectedSkin = null) {
    const options = [];

    if (selectedSkin) {
        options.push({
            label: 'Default',
            description: 'Return to the base character',
            value: 'default'
        });
    }

    characterData.skins.forEach((skin, index) => {
        if (selectedSkin && skin.name === selectedSkin.name) return;

        options.push({
            label: skin.name,
            value: String(index)
        });
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('char_select_skin')
            .setPlaceholder('Select a skin')
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
        .setDescription('Select what you want to see.')
        .setFooter({ text: 'MarvellousBOTground' });

    const image = selectedSkin?.image || characterData.image;

    if (image && image.startsWith('http')) {
        embed.setImage(image);
    }

    if (selectedSkin) {
        embed.addFields({
            name: 'Skin',
            value: selectedSkin.name
        });
    }

    return embed;
}

function createSkinsInfoEmbed(characterData, selectedSkin = null) {
    const embed = new EmbedBuilder()
        .setTitle(`${characterData.name} - Skins Information`)
        .setColor(0x2ecc71)
        .setFooter({ text: 'MarvellousBOTground' });

    if (!characterData.skins || characterData.skins.length === 0) {
        embed.setDescription('This character does not have any skins yet.');
        return embed;
    }

    if (!hasAdvancedSkins(characterData)) {
        embed.setDescription(characterData.skins.map(s => `• ${s}`).join('\n'));
        return embed;
    }

    const skinList = [];

    if (selectedSkin) {
        skinList.push('• Default');
    }

    characterData.skins.forEach(skin => {
        if (selectedSkin && skin.name === selectedSkin.name) return;
        skinList.push(`• ${skin.name}`);
    });

    embed.setDescription(
        skinList.join('\n') +
        '\n\nSelect a skin from the menu below.'
    );

    const image = selectedSkin?.image || characterData.image;

    if (image && image.startsWith('http')) {
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

    if (action === 'skins') {
        return createSkinsInfoEmbed(characterData, selectedSkin);
    }

    const gameplayData = mergeSkinData(characterData, selectedSkin);

    const displayName = selectedSkin
        ? `${characterData.name} - ${selectedSkin.name}`
        : characterData.name;

    const embed = new EmbedBuilder()
        .setTitle(`${displayName} - ${action.toUpperCase()}`)
        .setColor(colors[action])
        .setFooter({ text: 'MarvellousBOTground' });

    const image = selectedSkin?.image || characterData.image;

    if (image && image.startsWith('http')) {
        embed.setThumbnail(image);
    }

    if (action === 'attacks') {
        if (!gameplayData.attacks || gameplayData.attacks.length === 0) {
            embed.setDescription('This character does not have any attacks registered yet.');
        } else {
            embed.setDescription(
                gameplayData.attacks.map((a, index) =>
                    `**${getAttackIcon(a, index)} ${a.name}**\n` +
                    `Damage: ${a.damage}\n` +
                    `Cooldown: ${a.cooldown}\n` +
                    `Attributes: ${getAttributeEmojis(a)}`
                ).join('\n\n')
            );
        }
    }

    if (action === 'stats') {
        embed.setDescription(
            `**HP:** ${gameplayData.stats?.hp || gameplayData.stats?.["base hp"]}\n` +
            `**Speed:** ${gameplayData.stats?.speed}\n` +
            `**Damage:** ${gameplayData.stats?.damage}\n` +
            `**Skills:** ${gameplayData.stats?.skills}\n` +
            `**Low HP Animation:** ${gameplayData.stats?.lowHpAnimation ? '🟢' : '🔴'}\n` +
            `**Can Heal:** ${gameplayData.stats?.canHeal ? '🟢' : '🔴'}`
        );
    }

    if (action === 'lore') {
        embed.setDescription(selectedSkin?.lore || characterData.lore || 'No lore available.');
    }

    if (action === 'techs') {
        if (!gameplayData.techs || gameplayData.techs.length === 0) {
            embed.setDescription('This character does not have any uploaded techs yet.');
        } else {
            embed.setDescription(
                gameplayData.techs.map(t =>
                    `**${t.name}**\n${t.video}\n\nVideo by: ${t.credits}`
                ).join('\n\n')
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

    if (currentAction === 'skins' && hasAdvancedSkins(characterData)) {
        components.push(createSkinSelect(characterData, selectedSkin));
    }

    return components;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('char')
        .setDescription('Character information')
        .addStringOption(option =>
            option
                .setName('character')
                .setDescription('Select a character')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        try {
            const focusedValue = normalize(interaction.options.getFocused());
            const characters = getAllCharacters();

            const scored = characters
                .map(character => {
                    const name = normalize(character.data.name);
                    const key = normalize(character.key);
                    const aliases = character.data.aliases || [];
                    const allNames = [name, key, ...aliases.map(alias => normalize(alias))];

                    let score = 999;

                    if (allNames.some(n => n === focusedValue)) score = 0;
                    else if (allNames.some(n => n.startsWith(focusedValue))) score = 1;
                    else if (allNames.some(n => n.includes(focusedValue))) score = 2;

                    return { character, score };
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
            console.log('Autocomplete error:', error);
        }
    },

    async execute(interaction) {
        const characterInput = interaction.options.getString('character');
        const found = findCharacter(characterInput);

        if (!found) {
            return interaction.reply({
                content: 'Character not found.',
                ephemeral: true
            });
        }

        const character = found.data;

        let currentVersion = null;
        let currentAction = null;
        let currentSkin = null;

        if (character.versions) {
            const embed = new EmbedBuilder()
                .setTitle(character.name)
                .setColor(0x00ff99)
                .setDescription(`Select ${character.name} version`)
                .setFooter({ text: 'MarvellousBOTground' });

            if (character.image && character.image.startsWith('http')) {
                embed.setImage(character.image);
            }

            const message = await interaction.reply({
                embeds: [embed],
                components: [createVersionSelect(character)],
                fetchReply: true
            });

            const collector = message.createMessageComponentCollector({
                time: 120000
            });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: 'Only the person who used this command can interact with it.',
                        ephemeral: true
                    });
                }

                if (i.customId === 'char_select_version') {
                    currentVersion = character.versions.find(v => v.id === i.values[0]);
                    currentSkin = null;

                    if (currentAction) {
                        return i.update({
                            embeds: [createCharacterEmbed(currentVersion, currentAction, currentSkin)],
                            components: createComponents(
                                currentVersion,
                                currentAction,
                                currentSkin,
                                [createVersionSelect(character)]
                            )
                        });
                    }

                    return i.update({
                        embeds: [createCharacterStartEmbed(currentVersion)],
                        components: [
                            createVersionSelect(character),
                            createActionSelect()
                        ]
                    });
                }

                if (i.customId === 'char_select_skin') {
                    if (!currentVersion) {
                        return i.reply({
                            content: 'Select a version first.',
                            ephemeral: true
                        });
                    }

                    if (i.values[0] === 'default') {
                        currentSkin = null;
                    } else {
                        currentSkin = currentVersion.skins[Number(i.values[0])];
                    }

                    return i.update({
                        embeds: [createCharacterStartEmbed(currentVersion, currentSkin)],
                        components: [createActionSelect()]
                    });
                }

                if (i.customId === 'char_select_action') {
                    if (!currentVersion) {
                        return i.reply({
                            content: 'Select a version first.',
                            ephemeral: true
                        });
                    }

                    currentAction = i.values[0];

                    return i.update({
                        embeds: [createCharacterEmbed(currentVersion, currentAction, currentSkin)],
                        components: createComponents(
                            currentVersion,
                            currentAction,
                            currentSkin,
                            [createVersionSelect(character)]
                        )
                    });
                }
            });

            collector.on('end', async () => {
                try {
                    await interaction.editReply({ components: [] });
                } catch (error) {}
            });

            return;
        }

        const message = await interaction.reply({
            embeds: [createCharacterStartEmbed(character)],
            components: [createActionSelect()],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            time: 120000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'Only the person who used this command can interact with it.',
                    ephemeral: true
                });
            }

            if (i.customId === 'char_select_skin') {
                if (i.values[0] === 'default') {
                    currentSkin = null;
                } else {
                    currentSkin = character.skins[Number(i.values[0])];
                }

                return i.update({
                    embeds: [createCharacterStartEmbed(character, currentSkin)],
                    components: [createActionSelect()]
                });
            }

            if (i.customId === 'char_select_action') {
                currentAction = i.values[0];

                return i.update({
                    embeds: [createCharacterEmbed(character, currentAction, currentSkin)],
                    components: createComponents(character, currentAction, currentSkin)
                });
            }
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] });
            } catch (error) {}
        });
    }
};
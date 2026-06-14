const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const fs = require('fs');

const attributeChoices = [
    { name: 'Noticeable', value: 'noti' },
    { name: 'Vanish', value: 'inv' },
    { name: 'Area', value: 'area' },
    { name: 'Cinema', value: 'cine' },
    { name: 'Rng', value: 'rng' },
    { name: 'Blindness', value: 'blind' },
    { name: 'Push', value: 'push' },

    { name: 'Mele', value: 'mele' },
    { name: 'Range ++', value: 'lrp' },
    { name: 'Range +', value: 'lr' },
    { name: 'Range', value: 'range' },
    { name: 'Explode', value: 'ex' },
    { name: 'Grab', value: 'grab' },

    { name: 'Break', value: 'break' },
    { name: 'Ignore', value: 'ignore' },
    { name: 'Block', value: 'block' },

    { name: 'Movement', value: 'move' },
    { name: 'Teleport', value: 'tp' },

    { name: 'Heal', value: 'heal' },
    { name: 'Charge', value: 'charge' },
    { name: 'Transformation', value: 'trans' },

    { name: 'Brutality', value: 'bruta' },
    { name: 'Finisher', value: 'finish' },
    { name: 'Counter', value: 'coun' }
];

const attributeNames = Object.fromEntries(
    attributeChoices.map(a => [a.value, a.name])
);

const attributeAliases = {
    ranged: 'range',
    explode: 'ex',
    tele: 'tp',
    teleport: 'tp',
    teleportation: 'tp',
    transformation: 'trans',
    transform: 'trans',
    finisher: 'finish',
    counter: 'coun',
    shieldbreak: 'break',
    shieldBreak: 'break'
};

const universes = [
    'Invincible',
    'Marvel',
    'The Boys',
    'DC',
    'Star Wars',
    'Scream',
    'Dexter',
    'My Hero Academia',
    'Stranger Things',
    'Attack on Titan',
    'FNAF',
    'Squid Game',
    'Companion',
    'Creepypastas',
    'YOU',
    'Death Note',
    'God of War',
    'One Piece',
    'Real Life',
    'Halloween',
    'American Psycho',
    'Dune',
    'IT',
    'Pibby',
    'Rambo',
    'SCP Foundation',
    'Sonic',
    'Minecraft',
    'American Horror Story',
    'Breaking Bad'
];

function normalizeAttribute(attribute) {
    return attributeAliases[attribute] || attribute;
}

function getAttackAttributes(attack) {
    return (attack.attributes || []).map(normalizeAttribute);
}

function isSlotFive(attack) {
    return String(attack.slot) === '5';
}

function attackMatchesAttribute(attack, attribute) {
    const normalizedAttribute = normalizeAttribute(attribute);
    const attackAttributes = getAttackAttributes(attack);

    if (normalizedAttribute === 'heal' && isSlotFive(attack)) {
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

    if (character.versions && character.versions.length > 0) {
        return character.versions.some(version =>
            characterMatchesAttributes(version, attributes)
        );
    }

    return characterMatchesAttributes(character, attributes);
}

function formatAttributes(attack) {
    const attributes = getAttackAttributes(attack);

    if (!attributes.length) {
        return 'None';
    }

    return attributes
        .map(attribute => attributeNames[attribute] || attribute)
        .join(', ');
}

function formatSkin(skin) {
    if (typeof skin === 'string') return `• ${skin}`;
    return `• ${skin.name}`;
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
        .setColor(colors[action])
        .setFooter({ text: 'MarvellousBOTground' });

    if (character.image) {
        embed.setThumbnail(character.image);
    }

    if (action === 'attacks') {
        embed.setDescription(
            character.attacks.map(a =>
                `**${a.slot ? `${a.slot}. ` : ''}${a.name}**\n` +
                `Damage: ${a.damage}\n` +
                `Cooldown: ${a.cooldown}\n` +
                `Attributes: ${formatAttributes(a)}`
            ).join('\n\n')
        );
    }

    if (action === 'stats') {
        embed.setDescription(
            `**HP:** ${character.stats.hp || character.stats['base hp']}\n` +
            `**Speed:** ${character.stats.speed}\n` +
            `**Damage:** ${character.stats.damage}\n` +
            `**Skills:** ${character.stats.skills}\n` +
            `**Low HP Animation:** ${character.stats.lowHpAnimation ? '🟢' : '🔴'}\n` +
            `**Can Heal:** ${character.stats.canHeal ? '🟢' : '🔴'}`
        );
    }

    if (action === 'lore') {
        embed.setDescription(character.lore || 'No lore available.');
    }

    if (action === 'skins') {
        if (!character.skins || character.skins.length === 0) {
            embed.setDescription('This character does not have any skins yet.');
        } else {
            embed.setDescription(character.skins.map(formatSkin).join('\n'));
        }
    }

    if (action === 'techs') {
        if (!character.techs || character.techs.length === 0) {
            embed.setDescription('This character does not have any uploaded techs yet.');
        } else {
            embed.setDescription(
                character.techs.map(t =>
                    `**${t.name}**\n${t.video}\n\nVideo by: ${t.credits}`
                ).join('\n\n')
            );
        }
    }

    return embed;
}

function createStartEmbed(character) {
    const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setColor(0x00ff99)
        .setDescription('Select what information you want to see.')
        .setFooter({ text: 'MarvellousBOTground' });

    if (character.image) {
        embed.setImage(character.image);
    }

    return embed;
}

function createVersionStartEmbed(character) {
    const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setColor(0x00ff99)
        .setDescription(`Select ${character.name} version`)
        .setFooter({ text: 'MarvellousBOTground' });

    if (character.image) {
        embed.setImage(character.image);
    }

    return embed;
}

function createVersionSelect(character) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('search_select_version')
            .setPlaceholder(`Select ${character.name} version`)
            .addOptions(
                character.versions.map(version => ({
                    label: version.name,
                    value: version.id
                }))
            )
    );
}

function createSearchEmbed(results, page) {
    const start = page * 9;
    const current = results.slice(start, start + 9);
    const totalPages = Math.ceil(results.length / 9);

    return new EmbedBuilder()
        .setTitle('Search Results')
        .setColor(0x00ff99)
        .setDescription(
            current.map((c, i) =>
                `**${start + i + 1}. ${c.name}**\n> ${c.universe || 'Unknown universe'}`
            ).join('\n\n')
        )
        .setFooter({ text: `Page ${page + 1}/${totalPages} • MarvellousBOTground` });
}

function createPageButtons(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('search_prev')
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),

        new ButtonBuilder()
            .setCustomId('search_next')
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
    );
}

function createCharacterSelect(results, page) {
    const start = page * 9;
    const current = results.slice(start, start + 9);

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('search_select_character')
            .setPlaceholder('Select a character')
            .addOptions(
                current.map((character, i) => ({
                    label: character.name,
                    description: character.universe || 'Unknown universe',
                    value: String(start + i)
                }))
            )
    );
}

function createActionSelect() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('search_select_action')
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search characters by universe or attack attributes')

        .addStringOption(option =>
            option
                .setName('attribute1')
                .setDescription('Optional attribute')
                .setRequired(false)
                .addChoices(...attributeChoices)
        )

        .addStringOption(option =>
            option
                .setName('attribute2')
                .setDescription('Optional attribute')
                .setRequired(false)
                .addChoices(...attributeChoices)
        )

        .addStringOption(option =>
            option
                .setName('attribute3')
                .setDescription('Optional attribute')
                .setRequired(false)
                .addChoices(...attributeChoices)
        )

        .addStringOption(option =>
            option
                .setName('attribute4')
                .setDescription('Optional attribute')
                .setRequired(false)
                .addChoices(...attributeChoices)
        )

        .addStringOption(option =>
            option
                .setName('universe')
                .setDescription('Optional universe')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        const filtered = universes
            .filter(universe => universe.toLowerCase().includes(focusedValue))
            .slice(0, 25);

        await interaction.respond(
            filtered.map(universe => ({
                name: universe,
                value: universe
            }))
        );
    },

    async execute(interaction) {
        const universe = interaction.options.getString('universe');

        const attributes = [
            interaction.options.getString('attribute1'),
            interaction.options.getString('attribute2'),
            interaction.options.getString('attribute3'),
            interaction.options.getString('attribute4')
        ].filter(Boolean).map(normalizeAttribute);

        const files = fs.readdirSync('./data').filter(file =>
            file.toLowerCase().endsWith('.json')
        );

        const results = [];

        for (const file of files) {
            try {
                delete require.cache[require.resolve(`../data/${file}`)];

                const character = require(`../data/${file}`);

                const matchesUniverse = universe
                    ? character.universe === universe
                    : true;

                const matchesAttributes = characterOrVersionMatches(
                    character,
                    attributes
                );

                if (matchesUniverse && matchesAttributes) {
                    results.push(character);
                }

            } catch (error) {
                console.log(`Error loading ${file}:`, error.message);
            }
        }

        if (results.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Search Results')
                        .setColor(0xff0000)
                        .setDescription('No characters found with those filters.')
                        .setFooter({ text: 'MarvellousBOTground' })
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

            if (selectedCharacter.versions) {
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

            const startEmbed = selectedCharacter.versions
                ? createVersionStartEmbed(selectedCharacter)
                : createStartEmbed(selectedCharacter);

            const startComponents = selectedCharacter.versions
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

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: 'Only the person who used this command can interact with it.',
                        ephemeral: true
                    });
                }

                if (i.customId === 'search_select_version') {
                    currentVersion = selectedCharacter.versions.find(
                        v => v.id === i.values[0]
                    );

                    if (currentAction) {
                        return i.update({
                            embeds: [createCharacterEmbed(currentVersion, currentAction)],
                            components: [
                                createVersionSelect(selectedCharacter),
                                createActionSelect()
                            ]
                        });
                    }

                    return i.update({
                        embeds: [createStartEmbed(currentVersion)],
                        components: [
                            createVersionSelect(selectedCharacter),
                            createActionSelect()
                        ]
                    });
                }

                if (i.customId === 'search_select_action') {
                    currentAction = i.values[0];

                    const targetCharacter = currentVersion || selectedCharacter;

                    if (selectedCharacter.versions && !currentVersion) {
                        return i.reply({
                            content: 'Select a version first.',
                            ephemeral: true
                        });
                    }

                    return i.update({
                        embeds: [createCharacterEmbed(targetCharacter, currentAction)],
                        components: selectedCharacter.versions
                            ? [
                                createVersionSelect(selectedCharacter),
                                createActionSelect()
                            ]
                            : [createActionSelect()]
                    });
                }
            });

            collector.on('end', async () => {
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

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'Only the person who used this command can interact with it.',
                    ephemeral: true
                });
            }

            if (i.customId === 'search_prev') {
                page--;

                return i.update({
                    embeds: [createSearchEmbed(results, page)],
                    components: [
                        createCharacterSelect(results, page),
                        createPageButtons(page, totalPages)
                    ]
                });
            }

            if (i.customId === 'search_next') {
                page++;

                return i.update({
                    embeds: [createSearchEmbed(results, page)],
                    components: [
                        createCharacterSelect(results, page),
                        createPageButtons(page, totalPages)
                    ]
                });
            }

            if (i.customId === 'search_select_character') {
                const index = Number(i.values[0]);
                return openCharacter(i, results[index]);
            }

            if (i.customId === 'search_select_version') {
                if (!selectedCharacter || !selectedCharacter.versions) {
                    return i.reply({
                        content: 'No version available.',
                        ephemeral: true
                    });
                }

                currentVersion = selectedCharacter.versions.find(
                    v => v.id === i.values[0]
                );

                if (currentAction) {
                    return i.update({
                        embeds: [createCharacterEmbed(currentVersion, currentAction)],
                        components: [
                            createVersionSelect(selectedCharacter),
                            createActionSelect()
                        ]
                    });
                }

                return i.update({
                    embeds: [createStartEmbed(currentVersion)],
                    components: [
                        createVersionSelect(selectedCharacter),
                        createActionSelect()
                    ]
                });
            }

            if (i.customId === 'search_select_action') {
                if (!selectedCharacter) {
                    return i.reply({
                        content: 'No character selected.',
                        ephemeral: true
                    });
                }

                currentAction = i.values[0];

                if (selectedCharacter.versions && !currentVersion) {
                    return i.reply({
                        content: 'Select a version first.',
                        ephemeral: true
                    });
                }

                const targetCharacter = currentVersion || selectedCharacter;

                return i.update({
                    embeds: [createCharacterEmbed(targetCharacter, currentAction)],
                    components: selectedCharacter.versions
                        ? [
                            createVersionSelect(selectedCharacter),
                            createActionSelect()
                        ]
                        : [createActionSelect()]
                });
            }
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({
                    components: []
                });
            } catch (error) {}
        });
    }
};
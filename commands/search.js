const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const fs = require('fs');

const abilityChoices = [
    { name: 'Flight', value: 'flight' },
    { name: 'Heal', value: 'heal' },
    { name: 'Extra', value: 'extra' },
    { name: 'Shieldbreak', value: 'shieldbreak' },
    { name: 'RNG', value: 'rng' },
    { name: 'Ranged', value: 'ranged' },
    { name: 'Finisher', value: 'finisher' },
    { name: 'Counter', value: 'counter' },
    { name: 'Transformation', value: 'transformation' },
    { name: 'Teleportation', value: 'teleportation' },
    { name: 'Passive', value: 'passive' }
];

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
                `**${a.name}**\n` +
                `Damage: ${a.damage}\n` +
                `Cooldown: ${a.cooldown}\n` +
                `Shield Break: ${a.shieldBreak ? '🟢' : '🔴'}`
            ).join('\n\n')
        );
    }

    if (action === 'stats') {
        embed.setDescription(
            `**HP:** ${character.stats.hp || character.stats["base hp"]}\n` +
            `**Speed:** ${character.stats.speed}\n` +
            `**Damage:** ${character.stats.damage}\n` +
            `**Skills:** ${character.stats.skills}\n` +
            `**Low HP Animation:** ${character.stats.lowHpAnimation ? '🟢' : '🔴'}\n` +
            `**Can Heal:** ${character.stats.canHeal ? '🟢' : '🔴'}`
        );
    }

    if (action === 'lore') {
        embed.setDescription(character.lore);
    }

    if (action === 'skins') {
        if (!character.skins || character.skins.length === 0) {
            embed.setDescription('This character does not have any skins yet.');
        } else {
            embed.setDescription(character.skins.map(s => `• ${s}`).join('\n'));
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
        .setDescription('Search characters by tags')

        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Character type')
                .setRequired(true)
                .addChoices(
                    { name: 'Hero', value: 'hero' },
                    { name: 'Villain', value: 'villain' },
                    { name: 'Antihero', value: 'antihero' },
                    { name: 'Neutral', value: 'neutral' },
                    { name: 'Robot', value: 'robot' },
                    { name: 'Speedster', value: 'speedster' },
                    { name: 'Slasher', value: 'slasher' },
                    { name: 'Human', value: 'human' },
                    { name: 'Monster', value: 'monster' },
                    { name: 'Superhuman', value: 'superhuman' }
                )
        )

        .addStringOption(option =>
            option
                .setName('ability1')
                .setDescription('Required ability')
                .setRequired(true)
                .addChoices(...abilityChoices)
        )

        .addStringOption(option =>
            option
                .setName('ability2')
                .setDescription('Optional ability')
                .setRequired(false)
                .addChoices(...abilityChoices)
        )

        .addStringOption(option =>
            option
                .setName('ability3')
                .setDescription('Optional ability')
                .setRequired(false)
                .addChoices(...abilityChoices)
        )

        .addStringOption(option =>
            option
                .setName('ability4')
                .setDescription('Optional ability')
                .setRequired(false)
                .addChoices(...abilityChoices)
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
        const type = interaction.options.getString('type');
        const universe = interaction.options.getString('universe');

        const abilities = [
            interaction.options.getString('ability1'),
            interaction.options.getString('ability2'),
            interaction.options.getString('ability3'),
            interaction.options.getString('ability4')
        ].filter(Boolean);

        const files = fs.readdirSync('./data').filter(file => file.toLowerCase().endsWith('.json'));

        const results = [];

        for (const file of files) {
            try {
                delete require.cache[require.resolve(`../data/${file}`)];

                const character = require(`../data/${file}`);

                const typeTags = character.tags?.type || [];
                const abilityTags = character.tags?.ability || [];

                const hasType = typeTags.includes(type);

                const hasAbilities = abilities.every(ability =>
                    abilityTags.includes(ability)
                );

                const matchesUniverse = universe
                    ? character.universe === universe
                    : true;

                if (hasType && hasAbilities && matchesUniverse) {
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
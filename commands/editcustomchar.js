const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js");

const {
    loadCustomCharacters,
    saveCustomCharacters,
    loadCustomLikes,
    saveCustomLikes
} = require("../utils/customCharacters");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const attributeChoices = [
    { name: "Noticeable", value: "noti" },
    { name: "Vanish", value: "inv" },
    { name: "Area", value: "area" },
    { name: "Cinema", value: "cine" },
    { name: "RNG", value: "rng" },
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

function getExpiresAt(custom) {
    const base = custom.lastBoost || custom.createdAt || Math.floor(Date.now() / 1000);
    return base + THIRTY_DAYS;
}

function isExpired(custom) {
    return getExpiresAt(custom) <= Math.floor(Date.now() / 1000);
}

function updateSkills(custom) {
    if (!custom.stats) custom.stats = {};

    custom.stats.skills = Array.isArray(custom.attacks)
        ? custom.attacks.length
        : 0;
}

function getCustomOrReply(interaction, customs, likes, id) {
    const custom = customs[id];

    if (!custom) {
        return {
            error: new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Custom Character Not Found")
                .setDescription("No custom character exists with that ID.")
        };
    }

    if (isExpired(custom)) {
        delete customs[id];
        delete likes[id];

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        return {
            error: new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Custom Character Expired")
                .setDescription("This custom character expired and has been deleted.")
        };
    }

    if (custom.creator !== interaction.user.id) {
        return {
            error: new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ You cannot edit this character")
                .setDescription("Only the creator of this custom character can edit it.")
        };
    }

    if (!Array.isArray(custom.attacks)) custom.attacks = [];
    if (!Array.isArray(custom.skins)) custom.skins = [];
    if (!custom.stats) custom.stats = {};
    if (!custom.techs) custom.techs = [];

    return { custom };
}

function createConfirmRow(confirmId, cancelId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel("Yes, overwrite")
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel("No, cancel")
            .setStyle(ButtonStyle.Secondary)
    );
}

async function confirmOverwrite(interaction, embed, applyChanges) {
    const confirmId = `custom_confirm_${interaction.user.id}_${Date.now()}`;
    const cancelId = `custom_cancel_${interaction.user.id}_${Date.now()}`;

    const message = await interaction.reply({
        embeds: [embed],
        components: [createConfirmRow(confirmId, cancelId)],
        fetchReply: true,
        ephemeral: true
    });

    try {
        const button = await message.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 30000,
            filter: i => i.user.id === interaction.user.id
        });

        if (button.customId === cancelId) {
            const cancelledEmbed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle("❌ Edit cancelled")
                .setDescription("No changes were applied.");

            return button.update({
                embeds: [cancelledEmbed],
                components: []
            });
        }

        const resultEmbed = applyChanges();

        return button.update({
            embeds: [resultEmbed],
            components: []
        });

    } catch {
        const timeoutEmbed = new EmbedBuilder()
            .setColor("Grey")
            .setTitle("⌛ Confirmation expired")
            .setDescription("No changes were applied.");

        return interaction.editReply({
            embeds: [timeoutEmbed],
            components: []
        });
    }
}

function getAttackSlotChoices() {
    return [
        { name: "1", value: "1" },
        { name: "2", value: "2" },
        { name: "3", value: "3" },
        { name: "4", value: "4" },
        { name: "5", value: "5" },
        { name: "6", value: "6" },
        { name: "7", value: "7" },
        { name: "8", value: "8" },
        { name: "9", value: "9" },
        { name: "E", value: "E" }
    ];
}

function addAttributeOptions(subcommand) {
    for (let i = 1; i <= 8; i++) {
        subcommand.addStringOption(option =>
            option
                .setName(`attribute${i}`)
                .setDescription(`Attack attribute ${i}.`)
                .setRequired(false)
                .addChoices(...attributeChoices)
        );
    }

    return subcommand;
}

function getAttributes(interaction) {
    const attributes = [];

    for (let i = 1; i <= 8; i++) {
        const attribute = interaction.options.getString(`attribute${i}`);

        if (attribute && !attributes.includes(attribute)) {
            attributes.push(attribute);
        }
    }

    return attributes;
}

function successEmbed(title, description, custom) {
    return new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(title)
        .setThumbnail(custom.image || null)
        .setDescription(description)
        .setFooter({
            text: `ID: ${custom.id}`
        });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editcustomchar")
        .setDescription("Edit your custom character.")

        .addSubcommand(subcommand =>
            subcommand
                .setName("stats")
                .setDescription("Edit main info and stats.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Edit character name.")
                        .setRequired(false)
                        .setMaxLength(80)
                )
                .addAttachmentOption(option =>
                    option
                        .setName("image")
                        .setDescription("Edit character image.")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName("universe")
                        .setDescription("Edit character universe.")
                        .setRequired(false)
                        .setMaxLength(80)
                )
                .addIntegerOption(option =>
                    option
                        .setName("hp")
                        .setDescription("Edit character HP.")
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(9999)
                )
                .addStringOption(option =>
                    option
                        .setName("speed")
                        .setDescription("Edit character speed.")
                        .setRequired(false)
                        .addChoices(
                            {
                                name: "Normal",
                                value: "Normal"
                            },
                            {
                                name: "Slow",
                                value: "Slow"
                            }
                        )
                )
                .addBooleanOption(option =>
                    option
                        .setName("lowhpanim")
                        .setDescription("Edit low HP animation.")
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName("canheal")
                        .setDescription("Edit can heal.")
                        .setRequired(false)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("lore")
                .setDescription("Edit character lore.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("lore")
                        .setDescription("New character lore.")
                        .setRequired(true)
                        .setMaxLength(1500)
                )
        )

        .addSubcommand(subcommand =>
            addAttributeOptions(
                subcommand
                    .setName("attack")
                    .setDescription("Add or edit an attack.")
                    .addStringOption(option =>
                        option
                            .setName("id")
                            .setDescription("Custom Character ID.")
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option
                            .setName("slot")
                            .setDescription("Attack slot.")
                            .setRequired(true)
                            .addChoices(...getAttackSlotChoices())
                    )
                    .addStringOption(option =>
                        option
                            .setName("name")
                            .setDescription("Attack name.")
                            .setRequired(true)
                            .setMaxLength(80)
                    )
                    .addIntegerOption(option =>
                        option
                            .setName("damage")
                            .setDescription("Attack damage.")
                            .setRequired(true)
                            .setMinValue(0)
                            .setMaxValue(10000)
                    )
                    .addStringOption(option =>
                        option
                            .setName("cooldown")
                            .setDescription("Attack cooldown. Example: 12s")
                            .setRequired(true)
                            .setMaxLength(20)
                    )
            )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("deleteattack")
                .setDescription("Delete an attack.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("slot")
                        .setDescription("Attack slot.")
                        .setRequired(true)
                        .addChoices(...getAttackSlotChoices())
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("skin")
                .setDescription("Add or edit a skin.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("slot")
                        .setDescription("Skin slot. Leave empty to use the next free slot.")
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(8)
                )
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Skin name.")
                        .setRequired(true)
                        .setMaxLength(80)
                )
                .addAttachmentOption(option =>
                    option
                        .setName("image")
                        .setDescription("Skin image.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("lore")
                        .setDescription("Skin lore.")
                        .setRequired(true)
                        .setMaxLength(1000)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("deleteskin")
                .setDescription("Delete a skin.")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("Custom Character ID.")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("slot")
                        .setDescription("Skin slot.")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(8)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const result = getCustomOrReply(interaction, customs, likes, id);

        if (result.error) {
            return interaction.reply({
                embeds: [result.error],
                ephemeral: true
            });
        }

        const custom = result.custom;

        if (subcommand === "stats") {
            const name = interaction.options.getString("name");
            const image = interaction.options.getAttachment("image");
            const universe = interaction.options.getString("universe");
            const hp = interaction.options.getInteger("hp");
            const speed = interaction.options.getString("speed");
            const lowHpAnim = interaction.options.getBoolean("lowhpanim");
            const canHeal = interaction.options.getBoolean("canheal");

            if (
                !name &&
                !image &&
                !universe &&
                hp === null &&
                !speed &&
                lowHpAnim === null &&
                canHeal === null
            ) {
                const embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("⚠️ Nothing selected")
                    .setDescription("Use at least one option to edit this custom character.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (image && (!image.contentType || !image.contentType.startsWith("image/"))) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid image")
                    .setDescription("The uploaded file must be an image.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const changes = [];

            if (name) changes.push(`**Name:** ${custom.name} → ${name}`);
            if (image) changes.push("**Image:** will be overwritten");
            if (universe) changes.push(`**Universe:** ${custom.universe} → ${universe}`);
            if (hp !== null) changes.push(`**HP:** ${custom.stats.hp} → ${hp}`);
            if (speed) changes.push(`**Speed:** ${custom.stats.speed} → ${speed}`);
            if (lowHpAnim !== null) changes.push(`**Low HP Animation:** ${custom.stats.lowHpAnimation} → ${lowHpAnim}`);
            if (canHeal !== null) changes.push(`**Can Heal:** ${custom.stats.canHeal} → ${canHeal}`);

            const warningEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ Confirm overwrite")
                .setDescription(
                    `You are about to overwrite data from **${custom.name}**.\n\n` +
                    changes.join("\n") +
                    "\n\nDo you want to apply these changes?"
                );

            return confirmOverwrite(interaction, warningEmbed, () => {
                if (name) custom.name = name;
                if (image) custom.image = image.url;
                if (universe) custom.universe = universe;
                if (hp !== null) custom.stats.hp = hp;
                if (speed) custom.stats.speed = speed;
                if (lowHpAnim !== null) custom.stats.lowHpAnimation = lowHpAnim;
                if (canHeal !== null) custom.stats.canHeal = canHeal;

                updateSkills(custom);
                saveCustomCharacters(customs);

                return successEmbed(
                    "✅ Custom Character Updated",
                    `**${custom.name}** has been updated.\n\n${changes.join("\n")}`,
                    custom
                );
            });
        }

        if (subcommand === "lore") {
            const newLore = interaction.options.getString("lore");
            const hasOldLore = Boolean(custom.lore && custom.lore.trim().length > 0);

            const applyLore = () => {
                custom.lore = newLore;

                saveCustomCharacters(customs);

                return successEmbed(
                    "✅ Lore Updated",
                    `Lore for **${custom.name}** has been updated.`,
                    custom
                );
            };

            if (hasOldLore) {
                const warningEmbed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("⚠️ Confirm overwrite")
                    .setDescription(
                        `**${custom.name}** already has lore.\n\n` +
                        "This will overwrite the current lore.\n\n" +
                        "Do you want to apply this change?"
                    );

                return confirmOverwrite(interaction, warningEmbed, applyLore);
            }

            const embed = applyLore();

            return interaction.reply({
                embeds: [embed]
            });
        }

        if (subcommand === "attack") {
            const slot = interaction.options.getString("slot");
            const name = interaction.options.getString("name");
            const damage = interaction.options.getInteger("damage");
            const cooldown = interaction.options.getString("cooldown");
            const attributes = getAttributes(interaction);

            const existingIndex = custom.attacks.findIndex(
                attack => String(attack.slot).toUpperCase() === slot
            );

            const newAttack = {
                slot,
                name,
                damage,
                cooldown,
                attributes
            };

            const applyAttack = () => {
                if (existingIndex >= 0) {
                    custom.attacks[existingIndex] = newAttack;
                } else {
                    custom.attacks.push(newAttack);
                }

                custom.attacks.sort((a, b) => {
                    const order = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "E"];
                    return order.indexOf(String(a.slot)) - order.indexOf(String(b.slot));
                });

                updateSkills(custom);

                saveCustomCharacters(customs);

                return successEmbed(
                    existingIndex >= 0 ? "✅ Attack Overwritten" : "✅ Attack Added",
                    `**${custom.name}** attack slot **${slot}** has been ${existingIndex >= 0 ? "overwritten" : "added"}.\n\n` +
                    `**Name:** ${name}\n` +
                    `**Damage:** ${damage}\n` +
                    `**Cooldown:** ${cooldown}\n` +
                    `**Attributes:** ${attributes.length ? attributes.join(", ") : "None"}`,
                    custom
                );
            };

            if (existingIndex >= 0) {
                const oldAttack = custom.attacks[existingIndex];

                const warningEmbed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("⚠️ Confirm attack overwrite")
                    .setDescription(
                        `Attack slot **${slot}** already exists for **${custom.name}**.\n\n` +
                        `**Current:** ${oldAttack.name}\n` +
                        `**New:** ${name}\n\n` +
                        "This will overwrite the current attack.\n\n" +
                        "Do you want to apply this change?"
                    );

                return confirmOverwrite(interaction, warningEmbed, applyAttack);
            }

            if (custom.attacks.length >= 10) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Attack limit reached")
                    .setDescription("This custom character already has the maximum amount of attacks.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const embed = applyAttack();

            return interaction.reply({
                embeds: [embed]
            });
        }

        if (subcommand === "deleteattack") {
            const slot = interaction.options.getString("slot");

            const existingIndex = custom.attacks.findIndex(
                attack => String(attack.slot).toUpperCase() === slot
            );

            if (existingIndex < 0) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Attack not found")
                    .setDescription(`This custom character does not have an attack in slot **${slot}**.`);

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const oldAttack = custom.attacks[existingIndex];

            const warningEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ Confirm attack deletion")
                .setDescription(
                    `You are about to delete attack slot **${slot}** from **${custom.name}**.\n\n` +
                    `**Attack:** ${oldAttack.name}\n\n` +
                    "Attack slots will **not** be reordered.\n\n" +
                    "Do you want to delete it?"
                );

            return confirmOverwrite(interaction, warningEmbed, () => {
                custom.attacks.splice(existingIndex, 1);

                updateSkills(custom);
                saveCustomCharacters(customs);

                return successEmbed(
                    "✅ Attack Deleted",
                    `Attack slot **${slot}** has been deleted from **${custom.name}**.`,
                    custom
                );
            });
        }

        if (subcommand === "skin") {
            const slot = interaction.options.getInteger("slot");
            const name = interaction.options.getString("name");
            const image = interaction.options.getAttachment("image");
            const lore = interaction.options.getString("lore");

            if (image && (!image.contentType || !image.contentType.startsWith("image/"))) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid image")
                    .setDescription("The uploaded file must be an image.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            let targetIndex;

            if (slot) {
                targetIndex = slot - 1;
            } else {
                targetIndex = custom.skins.length;
            }

            if (!slot && custom.skins.length >= 8) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Skin limit reached")
                    .setDescription("This custom character already has 8 skins.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (slot && targetIndex > custom.skins.length) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid skin slot")
                    .setDescription(
                        `You cannot use slot **${slot}** yet.\n\n` +
                        `Next available slot is **${custom.skins.length + 1}**.`
                    );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const newSkin = {
                name,
                image: image.url,
                lore
            };

            const existingSkin = custom.skins[targetIndex];

            const applySkin = () => {
                custom.skins[targetIndex] = newSkin;

                saveCustomCharacters(customs);

                return successEmbed(
                    existingSkin ? "✅ Skin Overwritten" : "✅ Skin Added",
                    `Skin slot **${targetIndex + 1}** has been ${existingSkin ? "overwritten" : "added"} for **${custom.name}**.\n\n` +
                    `**Name:** ${name}`,
                    custom
                );
            };

            if (existingSkin) {
                const warningEmbed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("⚠️ Confirm skin overwrite")
                    .setDescription(
                        `Skin slot **${targetIndex + 1}** already exists for **${custom.name}**.\n\n` +
                        `**Current:** ${existingSkin.name}\n` +
                        `**New:** ${name}\n\n` +
                        "This will overwrite the current skin.\n\n" +
                        "Do you want to apply this change?"
                    );

                return confirmOverwrite(interaction, warningEmbed, applySkin);
            }

            const embed = applySkin();

            return interaction.reply({
                embeds: [embed]
            });
        }

        if (subcommand === "deleteskin") {
            const slot = interaction.options.getInteger("slot");
            const index = slot - 1;

            if (!custom.skins[index]) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Skin not found")
                    .setDescription(`This custom character does not have a skin in slot **${slot}**.`);

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const oldSkin = custom.skins[index];

            const warningEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ Confirm skin deletion")
                .setDescription(
                    `You are about to delete skin slot **${slot}** from **${custom.name}**.\n\n` +
                    `**Skin:** ${oldSkin.name}\n\n` +
                    "Skin slots after this one will be reordered.\n\n" +
                    "Do you want to delete it?"
                );

            return confirmOverwrite(interaction, warningEmbed, () => {
                custom.skins.splice(index, 1);

                saveCustomCharacters(customs);

                return successEmbed(
                    "✅ Skin Deleted",
                    `Skin slot **${slot}** has been deleted from **${custom.name}**.\n\nSkin slots were reordered.`,
                    custom
                );
            });
        }
    }
};
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

const {
    uploadCustomImage
} = require("../utils/imageUploader");

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const ATTACK_SLOT_CHOICES = [
    { name: "1", value: "1" },
    { name: "2", value: "2" },
    { name: "3", value: "3" },
    { name: "4", value: "4" },
    { name: "5", value: "5" },
    { name: "E", value: "E" },
    { name: "1B", value: "1B" },
    { name: "2B", value: "2B" },
    { name: "3B", value: "3B" },
    { name: "4B", value: "4B" },
    { name: "5B", value: "5B" },
    { name: "EB", value: "EB" }
];

const SLOT_ORDER = [
    "1", "2", "3", "4", "5", "E",
    "1B", "2B", "3B", "4B", "5B", "EB"
];

const ATTRIBUTE_CHOICES = [
    { name: "Clash", value: "clash" },
    { name: "Pasive", value: "pasive" },
    { name: "Noticeable", value: "noti" },
    { name: "Vanish", value: "inv" },
    { name: "Area", value: "area" },
    { name: "Cinema", value: "cine" },
    { name: "RNG", value: "rng" },
    { name: "Blindness", value: "blind" },
    { name: "Push", value: "push" },
    { name: "Pull", value: "pull" },
    { name: "Lingering", value: "lin" },
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
    { name: "Charges Use", value: "use" },
    { name: "Transformation", value: "trans" },
    { name: "Brutality", value: "bruta" },
    { name: "Finisher", value: "finish" },
    { name: "Counter", value: "coun" }
];

function containsEmoji(text) {
    if (!text) return false;

    const discordEmojiRegex = /<a?:\w+:\d+>/g;
    const unicodeEmojiRegex = /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u;

    return discordEmojiRegex.test(text) || unicodeEmojiRegex.test(text);
}

function getExpiresAt(custom) {
    const base = custom.lastBoost || custom.createdAt || Math.floor(Date.now() / 1000);
    return base + THIRTY_DAYS;
}

function isExpired(custom) {
    return getExpiresAt(custom) <= Math.floor(Date.now() / 1000);
}

function updateSkills(custom) {
    if (!custom.stats) custom.stats = {};
    custom.stats.skills = Array.isArray(custom.attacks) ? custom.attacks.length : 0;
}

function normalizeCustom(custom) {
    if (!custom.stats) custom.stats = {};
    if (!Array.isArray(custom.attacks)) custom.attacks = [];
    if (!Array.isArray(custom.skins)) custom.skins = [];
    if (!Array.isArray(custom.techs)) custom.techs = [];
    if (!custom.lore) custom.lore = "";
}

function sortAttacks(attacks) {
    attacks.sort((a, b) => {
        const aIndex = SLOT_ORDER.indexOf(String(a.slot).toUpperCase());
        const bIndex = SLOT_ORDER.indexOf(String(b.slot).toUpperCase());

        return aIndex - bIndex;
    });
}

function isBSlot(slot) {
    return String(slot).toUpperCase().endsWith("B");
}

function getBaseSlot(slot) {
    const value = String(slot).toUpperCase();

    if (value === "EB") return "E";

    return value.replace("B", "");
}

function hasSlot(custom, slot) {
    return custom.attacks.some(
        attack => String(attack.slot).toUpperCase() === String(slot).toUpperCase()
    );
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

function addAttributeOptions(subcommand) {
    for (let i = 1; i <= 8; i++) {
        subcommand.addStringOption(option =>
            option
                .setName(`attribute${i}`)
                .setDescription(`Attack attribute ${i}.`)
                .setRequired(false)
                .setAutocomplete(true)
        );
    }

    return subcommand;
}

function createSuccessEmbed(title, description, custom) {
    return new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle(title)
        .setThumbnail(custom.image || null)
        .setDescription(description)
        .setFooter({
            text: `ID: ${custom.id}`
        });
}

function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor("Red")
        .setTitle(title)
        .setDescription(description);
}

function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor("Orange")
        .setTitle(title)
        .setDescription(description);
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

async function confirmOverwrite(interaction, warningEmbed, applyChanges) {
    const confirmId = `confirm_${interaction.user.id}_${Date.now()}`;
    const cancelId = `cancel_${interaction.user.id}_${Date.now()}`;

    const message = await interaction.reply({
        embeds: [warningEmbed],
        components: [createConfirmRow(confirmId, cancelId)],
        ephemeral: true,
        fetchReply: true
    });

    try {
        const button = await message.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 30000,
            filter: i => i.user.id === interaction.user.id
        });

        if (button.customId === cancelId) {
            return button.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Grey")
                        .setTitle("❌ Edit cancelled")
                        .setDescription("No changes were applied.")
                ],
                components: []
            });
        }

        const resultEmbed = await applyChanges();

        return button.update({
            embeds: [resultEmbed],
            components: []
        });

    } catch (error) {
        console.log("Confirm overwrite error:", error.message);

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Grey")
                    .setTitle("⌛ Confirmation expired or failed")
                    .setDescription("No changes were applied.")
            ],
            components: []
        });
    }
}

function getCustomOrFail(interaction, customs, likes, id) {
    const custom = customs[id];

    if (!custom) {
        return {
            error: createErrorEmbed(
                "❌ Custom Character Not Found",
                "No custom character exists with that ID."
            )
        };
    }

    if (isExpired(custom)) {
        delete customs[id];
        delete likes[id];

        saveCustomCharacters(customs);
        saveCustomLikes(likes);

        return {
            error: createErrorEmbed(
                "❌ Custom Character Expired",
                "This custom character expired and has been deleted."
            )
        };
    }

    if (custom.creator !== interaction.user.id) {
        return {
            error: createErrorEmbed(
                "❌ You cannot edit this character",
                "Only the creator of this custom character can edit it."
            )
        };
    }

    if (custom.featured || likes[id]?.featured) {
        return {
            error: createErrorEmbed(
                "❌ Featured custom locked",
                "This custom character is featured and cannot be edited while it is featured."
            )
        };
    }

    normalizeCustom(custom);

    return { custom };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editcustomchar")
        .setDescription("Edit one of your custom characters.")

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
                            { name: "Normal", value: "Normal" },
                            { name: "Slow", value: "Slow" }
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
                            .addChoices(...ATTACK_SLOT_CHOICES)
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
                        .addChoices(...ATTACK_SLOT_CHOICES)
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
                .addIntegerOption(option =>
                    option
                        .setName("slot")
                        .setDescription("Skin slot. Empty = next free slot.")
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(8)
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

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);

        if (!focused.name.startsWith("attribute")) {
            return interaction.respond([]);
        }

        const query = String(focused.value || "").toLowerCase();

        const results = ATTRIBUTE_CHOICES
            .filter(attribute =>
                attribute.name.toLowerCase().includes(query) ||
                attribute.value.toLowerCase().includes(query)
            )
            .slice(0, 25)
            .map(attribute => ({
                name: `${attribute.name} (${attribute.value})`,
                value: attribute.value
            }));

        return interaction.respond(results);
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const id = interaction.options.getString("id").toUpperCase();

        const customs = loadCustomCharacters();
        const likes = loadCustomLikes();

        const result = getCustomOrFail(interaction, customs, likes, id);

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
                return interaction.reply({
                    embeds: [
                        createWarningEmbed(
                            "⚠️ Nothing selected",
                            "Use at least one option to edit this custom character."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (name && containsEmoji(name)) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid name",
                            "Custom character names cannot contain emojis."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (universe && containsEmoji(universe)) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid universe",
                            "Custom character universes cannot contain emojis."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (image && (!image.contentType || !image.contentType.startsWith("image/"))) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid image",
                            "The uploaded file must be an image."
                        )
                    ],
                    ephemeral: true
                });
            }

            const changes = [];

            const applyStats = async () => {
                if (name) {
                    custom.name = name;
                    changes.push(`**Name:** ${name}`);
                }

                if (image) {
                    const permanentImageUrl = await uploadCustomImage(
                        interaction.client,
                        image,
                        {
                            type: "character",
                            customId: custom.id,
                            characterName: custom.name,
                            creatorId: interaction.user.id
                        }
                    );

                    custom.image = permanentImageUrl;
                    changes.push("**Image:** updated");
                }

                if (universe) {
                    custom.universe = universe;
                    changes.push(`**Universe:** ${universe}`);
                }

                if (hp !== null) {
                    custom.stats.hp = hp;
                    changes.push(`**HP:** ${hp}`);
                }

                if (speed) {
                    custom.stats.speed = speed;
                    changes.push(`**Speed:** ${speed}`);
                }

                if (lowHpAnim !== null) {
                    custom.stats.lowHpAnimation = lowHpAnim;
                    changes.push(`**Low HP Animation:** ${lowHpAnim}`);
                }

                if (canHeal !== null) {
                    custom.stats.canHeal = canHeal;
                    changes.push(`**Can Heal:** ${canHeal}`);
                }

                updateSkills(custom);
                saveCustomCharacters(customs);

                return createSuccessEmbed(
                    "✅ Custom Character Updated",
                    `**${custom.name}** has been updated.\n\n${changes.join("\n")}`,
                    custom
                );
            };

            try {
                return interaction.reply({
                    embeds: [await applyStats()]
                });
            } catch (error) {
                console.log("Custom image upload error:", error.message);

                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Image upload failed",
                            "The image could not be uploaded to the storage channel."
                        )
                    ],
                    ephemeral: true
                });
            }
        }

        if (subcommand === "lore") {
            const newLore = interaction.options.getString("lore");
            const hasOldLore = custom.lore && custom.lore.trim().length > 0;

            const applyLore = async () => {
                custom.lore = newLore;
                saveCustomCharacters(customs);

                return createSuccessEmbed(
                    "✅ Lore Updated",
                    `Lore for **${custom.name}** has been updated.`,
                    custom
                );
            };

            if (hasOldLore) {
                return confirmOverwrite(
                    interaction,
                    createWarningEmbed(
                        "⚠️ Confirm lore overwrite",
                        `**${custom.name}** already has lore.\n\nThis will overwrite the current lore.\n\nDo you want to apply this change?`
                    ),
                    applyLore
                );
            }

            return interaction.reply({
                embeds: [await applyLore()]
            });
        }

        if (subcommand === "attack") {
            const slot = interaction.options.getString("slot").toUpperCase();
            const name = interaction.options.getString("name");
            const damage = interaction.options.getInteger("damage");
            const cooldown = interaction.options.getString("cooldown");
            const attributes = getAttributes(interaction);

            if (containsEmoji(name)) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid attack name",
                            "Attack names cannot contain emojis."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (isBSlot(slot)) {
                const baseSlot = getBaseSlot(slot);

                if (!hasSlot(custom, baseSlot)) {
                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                "❌ Missing base slot",
                                `You cannot create slot **${slot}** before creating slot **${baseSlot}**.`
                            )
                        ],
                        ephemeral: true
                    });
                }
            }

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

            const applyAttack = async () => {
                if (existingIndex >= 0) {
                    custom.attacks[existingIndex] = newAttack;
                } else {
                    custom.attacks.push(newAttack);
                }

                sortAttacks(custom.attacks);
                updateSkills(custom);
                saveCustomCharacters(customs);

                return createSuccessEmbed(
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

                return confirmOverwrite(
                    interaction,
                    createWarningEmbed(
                        "⚠️ Confirm attack overwrite",
                        `Attack slot **${slot}** already exists for **${custom.name}**.\n\n` +
                        `**Current:** ${oldAttack.name}\n` +
                        `**New:** ${name}\n\n` +
                        "This will overwrite the current attack.\n\nDo you want to apply this change?"
                    ),
                    applyAttack
                );
            }

            if (custom.attacks.length >= 12) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Attack limit reached",
                            "This custom character already has the maximum amount of attacks."
                        )
                    ],
                    ephemeral: true
                });
            }

            return interaction.reply({
                embeds: [await applyAttack()]
            });
        }

        if (subcommand === "deleteattack") {
            const slot = interaction.options.getString("slot").toUpperCase();

            const existingIndex = custom.attacks.findIndex(
                attack => String(attack.slot).toUpperCase() === slot
            );

            if (existingIndex < 0) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Attack not found",
                            `This custom character does not have an attack in slot **${slot}**.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const linkedBSlot = `${slot}B`;

            if (!isBSlot(slot) && hasSlot(custom, linkedBSlot)) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Delete alternate slot first",
                            `You must delete slot **${linkedBSlot}** before deleting slot **${slot}**.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const oldAttack = custom.attacks[existingIndex];

            return confirmOverwrite(
                interaction,
                createWarningEmbed(
                    "⚠️ Confirm attack deletion",
                    `You are about to delete attack slot **${slot}** from **${custom.name}**.\n\n` +
                    `**Attack:** ${oldAttack.name}\n\n` +
                    "Attack slots will **not** be reordered.\n\nDo you want to delete it?"
                ),
                async () => {
                    custom.attacks.splice(existingIndex, 1);

                    updateSkills(custom);
                    saveCustomCharacters(customs);

                    return createSuccessEmbed(
                        "✅ Attack Deleted",
                        `Attack slot **${slot}** has been deleted from **${custom.name}**.`,
                        custom
                    );
                }
            );
        }

        if (subcommand === "skin") {
            const slot = interaction.options.getInteger("slot");
            const name = interaction.options.getString("name");
            const image = interaction.options.getAttachment("image");
            const lore = interaction.options.getString("lore");

            if (containsEmoji(name)) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid skin name",
                            "Skin names cannot contain emojis."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (!image.contentType || !image.contentType.startsWith("image/")) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid image",
                            "The uploaded file must be an image."
                        )
                    ],
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
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Skin limit reached",
                            "This custom character already has 8 skins."
                        )
                    ],
                    ephemeral: true
                });
            }

            if (slot && targetIndex > custom.skins.length) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Invalid skin slot",
                            `You cannot use slot **${slot}** yet.\n\nNext available slot is **${custom.skins.length + 1}**.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const existingSkin = custom.skins[targetIndex];

            const applySkin = async () => {
                const permanentSkinImageUrl = await uploadCustomImage(
                    interaction.client,
                    image,
                    {
                        type: "skin",
                        customId: custom.id,
                        characterName: custom.name,
                        skinName: name,
                        creatorId: interaction.user.id
                    }
                );

                const newSkin = {
                    name,
                    image: permanentSkinImageUrl,
                    lore
                };

                custom.skins[targetIndex] = newSkin;

                saveCustomCharacters(customs);

                return createSuccessEmbed(
                    existingSkin ? "✅ Skin Overwritten" : "✅ Skin Added",
                    `Skin slot **${targetIndex + 1}** has been ${existingSkin ? "overwritten" : "added"} for **${custom.name}**.\n\n` +
                    `**Name:** ${name}`,
                    custom
                );
            };

            if (existingSkin) {
                return confirmOverwrite(
                    interaction,
                    createWarningEmbed(
                        "⚠️ Confirm skin overwrite",
                        `Skin slot **${targetIndex + 1}** already exists for **${custom.name}**.\n\n` +
                        `**Current:** ${existingSkin.name}\n` +
                        `**New:** ${name}\n\n` +
                        "This will overwrite the current skin.\n\nDo you want to apply this change?"
                    ),
                    applySkin
                );
            }

            try {
                return interaction.reply({
                    embeds: [await applySkin()]
                });
            } catch (error) {
                console.log("Custom skin image upload error:", error.message);

                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Image upload failed",
                            "The skin image could not be uploaded to the storage channel."
                        )
                    ],
                    ephemeral: true
                });
            }
        }

        if (subcommand === "deleteskin") {
            const slot = interaction.options.getInteger("slot");
            const index = slot - 1;

            if (!custom.skins[index]) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            "❌ Skin not found",
                            `This custom character does not have a skin in slot **${slot}**.`
                        )
                    ],
                    ephemeral: true
                });
            }

            const oldSkin = custom.skins[index];

            return confirmOverwrite(
                interaction,
                createWarningEmbed(
                    "⚠️ Confirm skin deletion",
                    `You are about to delete skin slot **${slot}** from **${custom.name}**.\n\n` +
                    `**Skin:** ${oldSkin.name}\n\n` +
                    "Skin slots after this one will be reordered.\n\nDo you want to delete it?"
                ),
                async () => {
                    custom.skins.splice(index, 1);

                    saveCustomCharacters(customs);

                    return createSuccessEmbed(
                        "✅ Skin Deleted",
                        `Skin slot **${slot}** has been deleted from **${custom.name}**.\n\nSkin slots were reordered.`,
                        custom
                    );
                }
            );
        }
    }
};
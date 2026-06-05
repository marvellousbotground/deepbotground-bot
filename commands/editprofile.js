const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(__dirname, "..", "database", "profiles.json");
const dataPath = path.join(__dirname, "..", "data");

const VALID_IMAGE_SOURCES = ["skin", "main", "discord"];

function loadProfiles() {
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    return JSON.parse(fs.readFileSync(profilesPath, "utf8"));
}

function saveProfiles(data) {
    fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
}

function createDefaultMainGame() {
    return {
        wins: 0,
        kills: 0,
        pvps: 0,
        mainCharacters: ["None", "None", "None"],
        mainCharacterImages: [null, null, null],
        favoriteSkin: "None",
        favoriteSkinImage: null,
        embedColor: "#2b2d31",
        imageSource: "skin",
        ranked: {
            rank: "Unranked",
            points: 0
        },
        casual: {
            level: 1,
            xp: 0
        },
        mainCharacterImage: null
    };
}

function normalizeHexColor(color) {
    if (!color) return null;

    let value = color.trim();

    if (!value.startsWith("#")) {
        value = `#${value}`;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return null;
    }

    return value;
}

function getCharactersAndSkins() {
    const characters = [];
    const skins = [];

    const files = fs
        .readdirSync(dataPath)
        .filter(file => file.endsWith(".json"));

    for (const file of files) {
        try {
            const fullPath = path.join(dataPath, file);

            delete require.cache[require.resolve(fullPath)];

            const character = require(fullPath);

            if (character.name) {
                characters.push({
                    name: character.name,
                    image: character.image || null
                });
            }

            if (Array.isArray(character.skins)) {
                for (const skin of character.skins) {
                    if (typeof skin === "string") {
                        skins.push({
                            name: skin,
                            image: character.image || null
                        });
                    } else if (skin?.name) {
                        skins.push({
                            name: skin.name,
                            image: skin.image || character.image || null
                        });

                        if (skin.dataFile) {
                            characters.push({
                                name: skin.name,
                                image: skin.image || character.image || null
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`Error reading ${file}:`, error.message);
        }
    }

    return { characters, skins };
}

function filterChoices(list, focusedValue) {
    const query = focusedValue.toLowerCase();

    return list
        .filter(item => item.name.toLowerCase().includes(query))
        .slice(0, 25)
        .map(item => ({
            name: item.name,
            value: item.name
        }));
}

function findImageByName(name) {
    if (!name || name === "None") return null;

    const { characters, skins } = getCharactersAndSkins();

    const foundCharacter = characters.find(
        c => c.name.toLowerCase() === name.toLowerCase()
    );

    if (foundCharacter?.image) {
        return foundCharacter.image;
    }

    const foundSkin = skins.find(
        s => s.name.toLowerCase() === name.toLowerCase()
    );

    if (foundSkin?.image) {
        return foundSkin.image;
    }

    return null;
}

function syncProfileImage(mainGame) {
    const imageSource = mainGame.imageSource || "skin";

    if (imageSource === "main") {
        const mainName = mainGame.mainCharacters?.[0];

        mainGame.mainCharacterImage =
            mainGame.mainCharacterImages?.[0] ||
            findImageByName(mainName) ||
            null;
    }

    if (imageSource === "skin") {
        const skinName = mainGame.favoriteSkin;

        mainGame.mainCharacterImage =
            mainGame.favoriteSkinImage ||
            findImageByName(skinName) ||
            null;
    }

    if (imageSource === "discord") {
        mainGame.mainCharacterImage = null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editprofile")
        .setDescription("Edit your game profile.")

        .addStringOption(option =>
            option
                .setName("main1")
                .setDescription("Set your first main character.")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("main2")
                .setDescription("Set your second main character.")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("main3")
                .setDescription("Set your third main character.")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option
                .setName("skin")
                .setDescription("Set your favorite skin.")
                .setRequired(false)
                .setAutocomplete(true)
        )

        .addIntegerOption(option =>
            option
                .setName("kills")
                .setDescription("Set your kills.")
                .setRequired(false)
                .setMinValue(0)
        )

        .addStringOption(option =>
            option
                .setName("color")
                .setDescription("Set your profile embed color. Example: #ff0000")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("image")
                .setDescription("Choose what image your profile shows.")
                .setRequired(false)
                .addChoices(
                    {
                        name: "Favorite skin",
                        value: "skin"
                    },
                    {
                        name: "First main character",
                        value: "main"
                    },
                    {
                        name: "Discord profile picture",
                        value: "discord"
                    }
                )
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        const { characters, skins } = getCharactersAndSkins();

        if (focused.name === "skin") {
            return interaction.respond(
                filterChoices(skins, focused.value)
            );
        }

        return interaction.respond(
            filterChoices(characters, focused.value)
        );
    },

    async execute(interaction) {
        const profiles = loadProfiles();
        const userId = interaction.user.id;

        if (!profiles[userId]) {
            profiles[userId] = {
                roblox: {
                    verified: false,
                    id: null,
                    username: "Not verified",
                    displayName: "Not verified"
                },
                mainGame: createDefaultMainGame()
            };

            saveProfiles(profiles);
        }

        const profile = profiles[userId];

        if (!profile.roblox || !profile.roblox.verified) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Roblox account not connected")
                .setDescription("Use `/verify` first.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        if (!profile.mainGame) {
            profile.mainGame = createDefaultMainGame();
        }

        if (!profile.mainGame.mainCharacters) {
            profile.mainGame.mainCharacters = ["None", "None", "None"];
        }

        if (!profile.mainGame.mainCharacterImages) {
            profile.mainGame.mainCharacterImages = [null, null, null];
        }

        if (!profile.mainGame.ranked) {
            profile.mainGame.ranked = {
                rank: "Unranked",
                points: 0
            };
        }

        if (!profile.mainGame.casual) {
            profile.mainGame.casual = {
                level: 1,
                xp: 0
            };
        }

        if (!profile.mainGame.embedColor) {
            profile.mainGame.embedColor = "#2b2d31";
        }

        if (!profile.mainGame.imageSource) {
            profile.mainGame.imageSource = "skin";
        }

        if (!profile.mainGame.favoriteSkin) {
            profile.mainGame.favoriteSkin = "None";
        }

        if (!profile.mainGame.mainCharacterImage) {
            syncProfileImage(profile.mainGame);
        }

        const main1 = interaction.options.getString("main1");
        const main2 = interaction.options.getString("main2");
        const main3 = interaction.options.getString("main3");
        const skin = interaction.options.getString("skin");
        const kills = interaction.options.getInteger("kills");
        const color = interaction.options.getString("color");
        const imageSource = interaction.options.getString("image");

        if (
            !main1 &&
            !main2 &&
            !main3 &&
            !skin &&
            kills === null &&
            !color &&
            !imageSource
        ) {
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ Nothing selected")
                .setDescription(
                    "Use the options to edit your profile.\n\n" +
                    "`/editprofile main1:Character main2:Character main3:Character skin:Skin kills:0 color:#ff0000 image:skin`"
                );

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        const changes = [];

        if (main1) {
            const image = findImageByName(main1);

            profile.mainGame.mainCharacters[0] = main1;
            profile.mainGame.mainCharacterImages[0] = image;

            changes.push(`🔥 Main 1: **${main1}**`);
        }

        if (main2) {
            const image = findImageByName(main2);

            profile.mainGame.mainCharacters[1] = main2;
            profile.mainGame.mainCharacterImages[1] = image;

            changes.push(`🔥 Main 2: **${main2}**`);
        }

        if (main3) {
            const image = findImageByName(main3);

            profile.mainGame.mainCharacters[2] = main3;
            profile.mainGame.mainCharacterImages[2] = image;

            changes.push(`🔥 Main 3: **${main3}**`);
        }

        if (skin) {
            const skinImage = findImageByName(skin);

            profile.mainGame.favoriteSkin = skin;
            profile.mainGame.favoriteSkinImage = skinImage;

            changes.push(`🎨 Favorite Skin: **${skin}**`);
        }

        if (kills !== null) {
            profile.mainGame.kills = kills;

            changes.push(`💀 Kills: **${kills}**`);
        }

        if (color) {
            const normalizedColor = normalizeHexColor(color);

            if (!normalizedColor) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid color")
                    .setDescription(
                        "Use a valid HEX color.\n\nExample: `#ff0000` or `ff0000`"
                    );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            profile.mainGame.embedColor = normalizedColor;

            changes.push(`🎨 Embed Color: **${normalizedColor}**`);
        }

        if (imageSource) {
            if (!VALID_IMAGE_SOURCES.includes(imageSource)) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("❌ Invalid image option")
                    .setDescription("Choose `skin`, `main`, or `discord`.");

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            profile.mainGame.imageSource = imageSource;

            const labels = {
                skin: "Favorite skin",
                main: "First main character",
                discord: "Discord profile picture"
            };

            changes.push(`🖼️ Profile Image: **${labels[imageSource]}**`);
        }

        syncProfileImage(profile.mainGame);

        saveProfiles(profiles);

        const embed = new EmbedBuilder()
            .setColor(profile.mainGame.embedColor || "Green")
            .setTitle("✅ Profile updated")
            .setDescription(changes.join("\n"));

        return interaction.reply({
            embeds: [embed]
        });
    }
};
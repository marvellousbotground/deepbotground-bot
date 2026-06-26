const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const LOGO_URL = "https://marvellousbot.win/assets/logo.png";

const WEBSITE_URL = "https://marvellousbot.win";
const SUPPORT_URL = "https://discord.gg/K6YjbTJhRR";

function createHomeEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Marvellous BOTground")
        .setDescription(
            "Welcome to **Marvellous BOTground**, the ultimate companion for **Marvellous Smackdown**.\n\n" +
            "Browse detailed character information, verify your Roblox account, compete in PvP, create custom characters, discover Featured Customs, and explore everything the community has to offer.\n\n" +
            "Use the buttons below to browse every command category."
        )
        .addFields(
            {
                name: "🌐 Website",
                value: WEBSITE_URL
            },
            {
                name: "💬 Support Server",
                value: SUPPORT_URL
            }
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • /help"
        });
}

function createGameEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📖 Game Commands")
        .setDescription(
            "**/char**\n" +
            "View complete information about any character, including stats, attacks, lore, skins, alternate versions, and available techs.\n\n" +

            "**/search**\n" +
            "Search the character database using universes, origins, attack attributes, character types, names, aliases, and more.\n\n" +

            "**/update**\n" +
            "View the latest Marvellous BOTground update directly inside Discord."
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • Game Commands"
        });
}

function createPvPEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("⚔️ PvP Commands")
        .setDescription(
            "**/pvp**\n" +
            "Challenge another player to a PvP battle and compete in Casual or Ranked matches.\n\n" +

            "**/leaderboard**\n" +
            "View the global PvP leaderboards and discover the highest ranked players.\n\n" +

            "**/pvpstats**\n" +
            "View your PvP profile, including RP, rank, wins, kills, favorite character, progress, and statistics."
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • PvP Commands"
        });
}

function createProfileEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("👤 Profile Commands")
        .setDescription(
            "**/verify**\n" +
            "Securely link your Roblox account using the official Roblox OAuth verification system.\n\n" +

            "**/profile**\n" +
            "Display your public Marvellous BOTground profile, Roblox account, favorite character, profile customization, and more.\n\n" +

            "**/editprofile**\n" +
            "Customize your public profile by changing your embed color, profile image, favorite skin, and other profile settings."
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • Profile Commands"
        });
}

function createCustomsEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎨 Custom Characters")
        .setDescription(
            "**/createcustomchar**\n" +
            "Create your own community custom character and share it with everyone.\n\n" +

            "**/customchar**\n" +
            "View any community-made custom character, including stats, attacks, skins, likes, creator information, and lore.\n\n" +

            "**/editcustomchar**\n" +
            "Edit one of your own custom characters and keep it up to date.\n\n" +

            "**/editfeatured**\n" +
            "Exclusive to approved Featured Character creators. Add attack descriptions and gameplay reference videos before publication on the website.\n\n" +

            "**/featuredcustoms**\n" +
            "Browse every Featured Custom Character selected by Marvellous BOTground.\n\n" +

            "**/boost**\n" +
            "Use a Boost to extend the remaining lifetime of one of your custom characters before it expires, allowing it to stay available for longer."
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • Custom Characters"
        });
}

function createWebsiteEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🌐 Website")
        .setDescription(
            "**🌐 Official Website**\n" +
            `${WEBSITE_URL}\n` +
            "Explore everything Marvellous BOTground has to offer.\n\n" +

            "**⭐ Featured Characters**\n" +
            `${WEBSITE_URL}/featured.html\n` +
            "Browse community Featured Characters with complete stats, attacks, skins, descriptions, and gameplay videos.\n\n" +

            "**📝 Update Logs**\n" +
            `${WEBSITE_URL}/updates.html\n` +
            "Read every update released for Marvellous BOTground.\n\n" +

            "**🔒 Privacy Policy**\n" +
            `${WEBSITE_URL}/privacy.html\n` +
            "Learn how your information is collected and used.\n\n" +

            "**📜 Terms of Service**\n" +
            `${WEBSITE_URL}/terms.html\n` +
            "Read the rules and terms for using Marvellous BOTground.\n\n" +

            "**💬 Support Server**\n" +
            `${SUPPORT_URL}\n` +
            "Join the community, report bugs, suggest new features, and receive support."
        )
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: "Marvellous BOTground • Website"
        });
}

function createButtons(active = "home") {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("help_game")
                .setLabel("Game Commands")
                .setEmoji("📖")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(active === "game"),

            new ButtonBuilder()
                .setCustomId("help_pvp")
                .setLabel("PvP Commands")
                .setEmoji("⚔️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(active === "pvp"),

            new ButtonBuilder()
                .setCustomId("help_profile")
                .setLabel("Profile Commands")
                .setEmoji("👤")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(active === "profile")
        ),

        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("help_customs")
                .setLabel("Custom Characters")
                .setEmoji("🎨")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(active === "customs"),

            new ButtonBuilder()
                .setCustomId("help_website")
                .setLabel("Website")
                .setEmoji("🌐")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(active === "website"),

            new ButtonBuilder()
                .setCustomId("help_home")
                .setLabel("Home")
                .setEmoji("🏠")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(active === "home")
        )
    ];
}

function getHelpPage(page) {
    if (page === "game") {
        return {
            embed: createGameEmbed(),
            active: "game"
        };
    }

    if (page === "pvp") {
        return {
            embed: createPvPEmbed(),
            active: "pvp"
        };
    }

    if (page === "profile") {
        return {
            embed: createProfileEmbed(),
            active: "profile"
        };
    }

    if (page === "customs") {
        return {
            embed: createCustomsEmbed(),
            active: "customs"
        };
    }

    if (page === "website") {
        return {
            embed: createWebsiteEmbed(),
            active: "website"
        };
    }

    return {
        embed: createHomeEmbed(),
        active: "home"
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View Marvellous BOTground commands and useful links."),

    async execute(interaction) {
        const message = await interaction.reply({
            embeds: [createHomeEmbed()],
            components: createButtons("home"),
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            time: 120000
        });

        collector.on("collect", async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "❌ Only the person who used this command can interact with this help menu.",
                    ephemeral: true
                });
            }

            const page = i.customId.replace("help_", "");
            const helpPage = getHelpPage(page);

            await i.update({
                embeds: [helpPage.embed],
                components: createButtons(helpPage.active)
            });
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
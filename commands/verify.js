const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const profilesPath = path.join(
    __dirname,
    "..",
    "database",
    "profiles.json"
);

function loadProfiles() {

    if (!fs.existsSync(profilesPath)) {

        fs.writeFileSync(
            profilesPath,
            JSON.stringify({}, null, 2)
        );
    }

    return JSON.parse(
        fs.readFileSync(profilesPath, "utf8")
    );
}

module.exports = {

    data: new SlashCommandBuilder()

        .setName("verify")
        .setDescription(
            "Connect your Roblox account."
        ),

    async execute(interaction) {

        const profiles = loadProfiles();

        const userId = interaction.user.id;

        const profile =
            profiles[userId];

        const isVerified =
            profile?.roblox?.verified;

        const verifyUrl =
            `https://deepbotground.onrender.com/roblox/login?discordId=${userId}`;

        const embed = new EmbedBuilder()

            .setColor(
                isVerified
                    ? "Green"
                    : "Red"
            )

            .setTitle(
                isVerified
                    ? "✅ Roblox Verified"
                    : "❌ Roblox Not Verified"
            )

            .setDescription(

                isVerified

                    ? `You are already verified as:\n🟩 **${profile.roblox.username || "Unknown"}**\n\nYou can re-verify if you want to connect a different Roblox account.`

                    : "You are not verified yet.\n\nClick the button below to connect your Roblox account."
            );

        const row =
            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setLabel(

                            isVerified
                                ? "Re-verify Roblox"
                                : "Connect Roblox"
                        )

                        .setStyle(
                            ButtonStyle.Link
                        )

                        .setURL(
                            verifyUrl
                        )
                );

        interaction.reply({

            embeds: [embed],

            components: [row],

            ephemeral: true
        });
    }
};
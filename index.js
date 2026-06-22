const app = require("./server");

const PORT = process.env.SERVER_PORT || 5012;

app.listen(PORT, () => {
    console.log(`✅ OAuth server running on port ${PORT}`);
});

const {
    Client,
    GatewayIntentBits,
    Collection
} = require("discord.js");

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
    handleCustomAdmin
} = require("./utils/customAdmin");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] ${file} is missing data or execute.`);
    }
}

client.once("ready", () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async message => {
    try {
        await handleCustomAdmin(message);
    } catch (error) {
        console.error("Custom admin error:", error);
    }
});

client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            await command.autocomplete(interaction);
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        await command.execute(interaction);

    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "❌ There was an error while executing this command.",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "❌ There was an error while executing this command.",
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);
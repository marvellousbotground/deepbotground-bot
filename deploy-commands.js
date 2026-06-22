const {
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
require("dotenv").config();

const commands = [];

const commandFiles = fs
    .readdirSync("./commands")
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if (
        !command.data ||
        typeof command.data.toJSON !== "function"
    ) {
        console.log(`Skipping ${file}`);
        continue;
    }

    commands.push(command.data.toJSON());
}

const rest = new REST({
    version: "10"
}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registrando comandos del servidor...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("Comandos registrados.");

    } catch (error) {
        console.error(error);
    }
})();
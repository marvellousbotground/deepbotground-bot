const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' })
    .setToken(process.env.TOKEN);

(async () => {

    try {

        console.log('Borrando comandos globales...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log('Comandos globales borrados.');

    } catch (error) {

        console.error(error);
    }

})();
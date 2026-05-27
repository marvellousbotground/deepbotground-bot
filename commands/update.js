const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

function readUpdateFile(fileName) {
    const path = `./updates/${fileName}`;

    if (!fs.existsSync(path)) {
        return 'No update file found.';
    }

    return fs.readFileSync(path, 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Show game or bot updates')

        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Select update type')
                .setRequired(true)
                .addChoices(
                    { name: 'Bot Updates', value: 'bot' },
                    { name: 'Game Updates', value: 'game' }
                )
        ),

    async execute(interaction) {
        const type = interaction.options.getString('type');

        const fileName = type === 'bot'
            ? 'bot.txt'
            : 'game.txt';

        const title = type === 'bot'
            ? 'MARVELLOUS BOTGROUND BETA'
            : 'MARVELLOUS PLAYGROUND GAME UPDATES';

        const color = type === 'bot'
            ? 0x00ff99
            : 0xff8800;

        const image = type === 'bot'
            ? 'https://media.discordapp.net/attachments/1507041233501950142/1507832640831754312/image2.png?ex=6a135613&is=6a120493&hm=22e4b643eaedeacdd3df6f0cc85848f28ff20e678db30455ea75aeeba3ab6ea3&=&format=webp&quality=lossless&width=350&height=350'
            : 'https://media.discordapp.net/attachments/1507041233501950142/1507832698167623830/noFilter.png?ex=6a135621&is=6a1204a1&hm=eb7a601a10c66e414541907cd953d1aec6a029a40b5da77001d5a19dd535b755&=&format=webp&quality=lossless';

        const content = readUpdateFile(fileName);

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setDescription(content.slice(0, 4000))
            .setImage(image)
            .setFooter({ text: 'MarvellousBOTground' });

        return interaction.reply({
            embeds: [embed]
        });
    }
};
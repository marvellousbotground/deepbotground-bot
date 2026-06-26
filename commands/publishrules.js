const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const OWNER_ID = "612102125580713985";

function ruleEmbed(color, title, description) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text: "Marvellous BOTground"
        });
}

const spanishRules = [
    ruleEmbed(
        0xff3333,
        "🇪🇸 📜 Reglas del Servidor",
        "Bienvenido al servidor de **Marvellous BOTground**.\n\nAl permanecer en este servidor aceptas seguir estas reglas, los Términos de Discord y las indicaciones del staff.\n\nLas sanciones pueden incluir advertencias, muteos, expulsiones o bans dependiendo de la gravedad."
    ),
    ruleEmbed(
        0xff3333,
        "🇪🇸 🤝 Conducta General",
        "**1. Respeto obligatorio.**\nNo se permite acoso, toxicidad extrema, discriminación, racismo, homofobia, amenazas ni ataques personales.\n\n**2. No drama innecesario.**\nNo generes peleas, rumores, discusiones personales o conflictos públicos. Reporta los problemas al staff.\n\n**3. No suplantación.**\nNo imites a staff, creadores, youtubers u otros usuarios con nombres, fotos o perfiles."
    ),
    ruleEmbed(
        0xff3333,
        "🇪🇸 🚫 Contenido Prohibido",
        "**4. Servidor SFW.**\nNo se permite NSFW, contenido sexual, gore extremo, avatares inapropiados, nombres ofensivos o estados explícitos.\n\n**5. No contenido peligroso.**\nProhibido doxxing, IP grabbers, scams, malware, phishing, links maliciosos o filtración de información privada.\n\n**6. No bromas sensibles.**\nEvita bromas sobre tragedias reales, suicidio, terrorismo, tiroteos, abuso infantil o temas similares."
    ),
    ruleEmbed(
        0xff3333,
        "🇪🇸 💬 Chat y Voz",
        "**7. No spam o flood.**\nNo repitas mensajes, emojis, letras, copypastes, cadenas, mayúsculas excesivas o menciones masivas.\n\n**8. Usa cada canal correctamente.**\nMantén los temas en sus canales correspondientes.\n\n**9. No publicidad.**\nNo promociones servidores, redes, canales, streams o productos sin permiso.\n\n**10. No mendigar.**\nNo pidas Robux, roles, Nitro, dinero, staff, gamepasses o premios.\n\n**11. Voice chat.**\nNo earrape, soundboards molestos, mic spam, música fuerte ni acoso por voz."
    ),
    ruleEmbed(
        0xff3333,
        "🇪🇸 🎮 Juego, Customs y Staff",
        "**12. No exploits.**\nUsar hacks, scripts, cheats o ventajas injustas en Marvellous Smackdown puede causar ban permanente.\n\n**13. No abusar bugs.**\nReporta bugs en vez de abusarlos.\n\n**14. Custom Characters.**\nLos customs no pueden tener NSFW, odio, acoso, imágenes ofensivas, links peligrosos o contenido que rompa las reglas.\n\n**15. Featured Characters.**\nLos personajes destacados pueden ser removidos si rompen reglas o dejan de ser apropiados.\n\n**16. Respeta al staff.**\nNo molestes, acoses o pingees al staff sin razón. Las decisiones del staff son finales.\n\n**17. Privacidad.**\nNo compartas información personal, imágenes privadas, nombres reales, direcciones, teléfonos o conversaciones privadas.\n\n**18. Reportes.**\nReporta problemas al staff con pruebas. Los reportes falsos también pueden ser sancionados."
    )
];

const englishRules = [
    ruleEmbed(
        0x3498db,
        "🏈 📜 Server Rules",
        "Welcome to the **Marvellous BOTground** server.\n\nBy staying in this server, you agree to follow these rules, Discord Terms of Service, and staff instructions.\n\nPunishments may include warnings, timeouts, kicks, or bans depending on severity."
    ),
    ruleEmbed(
        0x3498db,
        "🏈 🤝 General Conduct",
        "**1. Be respectful.**\nHarassment, extreme toxicity, discrimination, racism, homophobia, threats, and personal attacks are not allowed.\n\n**2. No unnecessary drama.**\nDo not start fights, rumors, witch hunts, personal conflicts, or public arguments. Report issues to staff.\n\n**3. No impersonation.**\nDo not impersonate staff, creators, YouTubers, or other members through names, avatars, or profiles."
    ),
    ruleEmbed(
        0x3498db,
        "🏈 🚫 Prohibited Content",
        "**4. Keep it SFW.**\nNSFW, sexual content, extreme gore, inappropriate avatars, offensive names, and explicit statuses are not allowed.\n\n**5. No dangerous content.**\nDoxxing, IP grabbers, scams, malware, phishing, malicious links, and private information leaks are forbidden.\n\n**6. No sensitive jokes.**\nAvoid jokes about real tragedies, suicide, terrorism, shootings, child abuse, or similar topics."
    ),
    ruleEmbed(
        0x3498db,
        "🏈 💬 Chat & Voice",
        "**7. No spam or flooding.**\nDo not spam repeated messages, emojis, letters, copypastas, chains, excessive caps, or mass mentions.\n\n**8. Use channels correctly.**\nKeep topics in the proper channels.\n\n**9. No advertising.**\nDo not promote servers, socials, channels, streams, or products without permission.\n\n**10. No begging.**\nDo not beg for Robux, roles, Nitro, money, staff, gamepasses, or rewards.\n\n**11. Voice chat.**\nNo earrape, annoying soundboards, mic spam, loud music, or voice harassment."
    ),
    ruleEmbed(
        0x3498db,
        "🏈 🎮 Game, Customs & Staff",
        "**12. No exploiting.**\nUsing hacks, scripts, cheats, or unfair advantages in Marvellous Smackdown may result in a permanent ban.\n\n**13. No bug abuse.**\nReport bugs instead of abusing them.\n\n**14. Custom Characters.**\nCustoms may not contain NSFW, hate, harassment, offensive images, dangerous links, or rule-breaking content.\n\n**15. Featured Characters.**\nFeatured characters may be removed if they break rules or become inappropriate.\n\n**16. Respect staff.**\nDo not harass, spam, or ping staff without reason. Staff decisions are final.\n\n**17. Privacy.**\nDo not share personal information, private images, real names, addresses, phone numbers, or private conversations.\n\n**18. Reports.**\nReport issues to staff with proof. False reports may also be punished."
    )
];

const portugueseRules = [
    ruleEmbed(
        0x2ecc71,
        "⚽ 📜 Regras do Servidor",
        "Bem-vindo ao servidor de **Marvellous BOYground**.\n\nAo permanecer neste servidor, você concorda em seguir estas regras, os Termos do Discord e as instruções da equipe.\n\nAs punições podem incluir avisos, silenciamentos, expulsões ou banimentos dependendo da gravidade."
    ),
    ruleEmbed(
        0x2ecc71,
        "⚽ 🤝 Conduta Geral",
        "**1. Respeito obrigatório.**\nAssédio, toxicidade extrema, discriminação, racismo, homofobia, ameaças e ataques pessoais não são permitidos.\n\n**2. Sem drama desnecessário.**\nNão crie brigas, rumores, conflitos pessoais ou discussões públicas. Reporte problemas à equipe.\n\n**3. Não se passe por outra pessoa.**\nNão imite staff, criadores, YouTubers ou membros usando nomes, fotos ou perfis."
    ),
    ruleEmbed(
        0x2ecc71,
        "⚽ 🚫 Conteúdo Proibido",
        "**4. Servidor SFW.**\nNSFW, conteúdo sexual, gore extremo, avatares inadequados, nomes ofensivos e status explícitos são proibidos.\n\n**5. Sem conteúdo perigoso.**\nDoxxing, IP grabbers, golpes, malware, phishing, links maliciosos e vazamento de informações privadas são proibidos.\n\n**6. Sem piadas sensíveis.**\nEvite piadas sobre tragédias reais, suicídio, terrorismo, tiroteios, abuso infantil ou temas semelhantes."
    ),
    ruleEmbed(
        0x2ecc71,
        "⚽ 💬 Chat e Voz",
        "**7. Sem spam ou flood.**\nNão envie mensagens repetidas, emojis em excesso, letras repetidas, copypastas, correntes, caps excessivo ou menções em massa.\n\n**8. Use os canais corretamente.**\nMantenha os assuntos nos canais certos.\n\n**9. Sem publicidade.**\nNão divulgue servidores, redes sociais, canais, streams ou produtos sem permissão.\n\n**10. Não implore.**\nNão peça Robux, cargos, Nitro, dinheiro, staff, gamepasses ou recompensas.\n\n**11. Chat de voz.**\nSem earrape, soundboards irritantes, mic spam, música alta ou assédio por voz."
    ),
    ruleEmbed(
        0x2ecc71,
        "⚽ 🎮 Jogo, Customs e Staff",
        "**12. Sem exploits.**\nUsar hacks, scripts, cheats ou vantagens injustas em Marvellous Smackdown pode resultar em banimento permanente.\n\n**13. Sem abuso de bugs.**\nReporte bugs em vez de abusar deles.\n\n**14. Custom Characters.**\nCustoms não podem conter NSFW, ódio, assédio, imagens ofensivas, links perigosos ou conteúdo contra as regras.\n\n**15. Featured Characters.**\nPersonagens destacados podem ser removidos se quebrarem regras ou se tornarem inadequados.\n\n**16. Respeite a equipe.**\nNão assedie, perturbe ou marque staff sem motivo. As decisões da equipe são finais.\n\n**17. Privacidade.**\nNão compartilhe informações pessoais, imagens privadas, nomes reais, endereços, telefones ou conversas privadas.\n\n**18. Denúncias.**\nReporte problemas à equipe com provas. Denúncias falsas também podem ser punidas."
    )
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("publishrules")
        .setDescription("Publish the server rules embeds.")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Rules channel")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),

    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({
                content: "❌ You cannot use this command.",
                ephemeral: true
            });
        }

        const channel =
            interaction.options.getChannel("channel") ||
            interaction.channel;

        await interaction.reply({
            content: `Publishing rules in ${channel}...`,
            ephemeral: true
        });

        const allEmbeds = [
            ...spanishRules,
            ...englishRules,
            ...portugueseRules
        ];

        for (const embed of allEmbeds) {
            await channel.send({
                embeds: [embed]
            });
        }

        await interaction.editReply({
            content: `✅ Rules published in ${channel}.`
        });
    }
};
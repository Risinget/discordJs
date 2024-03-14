const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token, clientId, guildId } = require("./config.json");
const fetch = require("node-fetch");
const JSZip = require("jszip");
const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
});

// Definir el comando Slash con parámetros usando SlashCommandBuilder
const serverCommand = new SlashCommandBuilder()
  .setName('server')
  .setDescription('Obtain information from a Public Server (JAVA)')
  .addStringOption(option => 
    option.setName('ip')
      .setDescription('The IP address of the server')
      .setRequired(true))
  .addIntegerOption(option => 
    option.setName('port')
      .setDescription('Port if there is one')
      .setRequired(false))
  .toJSON(); // Convertir a un formato JSON válido para la API de Discord
// Definir el comando Slash con parámetros usando SlashCommandBuilder
const embedCommand = new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Envía un embed personalizado')
    .addStringOption(option =>
        option.setName('titulo')
            .setDescription('El título del embed')
            .setRequired(true))
    .toJSON(); // Convertir a JSON
const commands = [
  {
    name: "download_emojis",
    description: "Descarga todos los emojis del servidor en un archivo ZIP.",
  },
  {
    name: "print_hello",
    description: "Prints a hello message.",
  },
  serverCommand, // Incluir el comando definido por SlashCommandBuilder
  embedCommand
];

const rest = new REST({ version: "9" }).setToken(token);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Registrar comandos slash después de que el bot esté listo
  (async () => {
    try {
      console.log(
        "Empezando el proceso de registro de comandos (/) a la API de Discord."
      );

      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });

      console.log("Comandos (/) registrados exitosamente.");
    } catch (error) {
      console.error(error);
    }
  })();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "download_emojis") {
    if (!interaction.guild) {
      return interaction.reply(
        "Este comando solo se puede usar en un servidor."
      );
    }

    const zip = new JSZip();
    const emojis = interaction.guild.emojis.cache;

    if (emojis.size === 0)
      return interaction.reply("Este servidor no tiene emojis.");

    for (const emoji of emojis.values()) {
      const response = await fetch(emoji.url);
      const buffer = await response.buffer();
      zip.file(`${emoji.name}.${emoji.url.split(".").pop()}`, buffer);
    }

    // Genera el archivo ZIP y lo guarda localmente
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream("emojis.zip"))
      .on("finish", async () => {
        // Enviar el archivo ZIP en la interacción
        await interaction.reply({
          content: "Los emojis han sido guardados y comprimidos en emojis.zip",
          files: ["emojis.zip"],
        });
      });
  } else if (commandName === "print_hello") {
    // Lógica para el comando printHello
    if (!interaction.guild) {
      return interaction.reply(
        "Este comando solo se puede usar en un servidor."
      );
    }

    await interaction.reply({
      content: "¡Hola! Este es un mensaje de prueba.",
    });
  } if (commandName === "server") {
    const ip = interaction.options.getString("ip");
    const port = interaction.options.getInteger("port"); // Puede ser null si el usuario no lo proporciona

    // Ahora puedes utilizar 'ip' y 'port' para realizar la lógica de tu comando.
    await interaction.reply(
      `Información del servidor: IP ${ip}, Port ${
        port ? port : "no proporcionado"
      }`
    );
  }else if (commandName === "embed") {
    const title = interaction.options.getString("titulo");
    const embed = new EmbedBuilder()
      .setTitle(title) // Título del embed
      .setDescription("Este es un mensaje embed de ejemplo.") // Descripción del embed
      .setURL(
        "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico"
      ) // URL del título del embed
      .setColor(0x0099ff) // Color del embed
      .setAuthor({
        name: "Autor",
        iconURL:
          "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico",
        url: "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico",
      }) // Autor del embed
      .setThumbnail(
        "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico"
      ) // Miniatura del embed
      .addFields(
        // Agregar múltiples campos
        { name: "Campo 1", value: "Valor 1", inline: true },
        { name: "Campo 2", value: "Valor 2", inline: true },
        { name: "Campo 3", value: "Valor 3", inline: true },
        { name: "Campo 4", value: "Valor 4", inline: false }
        // ... puedes agregar más campos
      )
      .setImage(
        "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico"
      ) // Imagen principal del embed
      .setTimestamp() // Marca de tiempo
      .setFooter({
        text: "Pie de página",
        iconURL:
          "https://theme.zdassets.com/theme_assets/678183/84b82d07b293907113d9d4dafd29bfa170bbf9b6.ico",
      }); // Pie de página del embed

    await interaction.reply({ embeds: [embed] });
  } else {
    // Lógica para el comando printHello
    if (!interaction.guild) {
      return interaction.reply(
        "Este comando solo se puede usar en un servidor."
      );
    }

    await interaction.reply({
      content: "Comando incorrecto",
    });
  }


});





client.login(token);

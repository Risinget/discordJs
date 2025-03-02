const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token, clientId, guildId } = require("./config.json");
const fetch = require("node-fetch");
const JSZip = require("jszip");
const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { create } = require("domain");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
});

const eCommand = new SlashCommandBuilder()
  .setName("e")
  .setDescription("Descarga un emoji específico por su ID.")
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("El ID del emoji que deseas descargar.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("El formato del emoji (png, webp, jpg, jpeg, gif).")
      .setRequired(true)
  )
  .toJSON();


// Definir el comando Slash con parámetros usando SlashCommandBuilder
const serverCommand = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Obtain information from a Public Server (JAVA)")
  .addStringOption((option) =>
    option
      .setName("ip")
      .setDescription("The IP address of the server")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("port")
      .setDescription("Port if there is one")
      .setRequired(false)
  )
  .toJSON(); // Convertir a un formato JSON válido para la API de Discord

const embedCommand = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Envía un embed personalizado")
  .addStringOption((option) =>
    option
      .setName("titulo")
      .setDescription("El título del embed")
      .setRequired(true)
  )
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
  embedCommand,
  eCommand
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

  try {
    if (commandName === "download_emojis") {
      if (!interaction.guild) {
        return interaction.reply(
          "Este comando solo se puede usar en un servidor."
        );
      }
      const randomZipName = 'emojis_'+interaction.guild.id+"_"+(Math.random().toString(36).substring(7)).toUpperCase() + ".zip";
      const zip = new JSZip();
      const emojis = interaction.guild.emojis.cache;

      if (emojis.size === 0) {
        return interaction.reply("Este servidor no tiene emojis.");
      }

      for (const emoji of emojis.values()) {
        const response = await fetch(emoji.imageURL());
        const buffer = await response.buffer();
        zip.file(`${emoji.name}.${emoji.imageURL().split(".").pop()}`, buffer);
      }

      zip
        .generateNodeStream({ type: "nodebuffer", streamFiles: true })
        .pipe(fs.createWriteStream(randomZipName))
        .on("finish", async () => {
          await interaction.reply({
            content:
              "Los emojis han sido guardados y comprimidos en emojis.zip",
            files: [randomZipName],
          });

          fs.rm(randomZipName, (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(`${randomZipName} eliminado exitosamente.`);
          });
        })
        .on("error", (err) => {
          console.error("Error generating ZIP file:", err);
          interaction.reply("Hubo un error al generar el archivo ZIP.");
        });
    } else if (commandName === "print_hello") {
      if (!interaction.guild) {
        return interaction.reply(
          "Este comando solo se puede usar en un servidor."
        );
      }

      await interaction.reply({
        content: "¡Hola! Este es un mensaje de prueba.",
      });
    } else if (commandName === "server") {
      const ip = interaction.options.getString("ip");
      const port = interaction.options.getInteger("port") || "no proporcionado";

      await interaction.reply(
        `Información del servidor: IP ${ip}, Port ${port}`
      );
    } else if (commandName === "embed") {
      const title = interaction.options.getString("titulo");
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription("Este es un mensaje embed de ejemplo.")
        .setColor(0x0099ff)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (commandName === "e") {
      const emojiId = interaction.options.getString("id");
      const format = interaction.options.getString("type");
      
      // Lista de formatos a probar
      const formats = ["png", "webp", "jpg", "jpeg", "gif"];

      // Verificar si el formato especificado es válido
      if (format && !formats.includes(format)) {
        return interaction.reply(
          "Formato no soportado. Usa uno de los siguientes: png, webp, jpg, jpeg, gif. <:mc:1345561069258805269>"
        );
      }
      let emojiUrl;
      let response;

      emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${format}`;
      response = await fetch(emojiUrl);

      if (!response.ok) {
        await interaction.reply("No se pudo encontrar el emoji con el ID proporcionado.");
      }
      // Descargar el emoji
      const buffer = await response.buffer();
      const fileName = `emoji.${format}`;
      // Enviar el emoji como archivo adjunto

      const createdEmoji = await interaction.guild.emojis.create({
        attachment: buffer,
        name: `emoji_${emojiId}`, // Nombre del emoji (puedes personalizarlo)
      });
      if (!(createdEmoji.available == true)) {
        await interaction.reply({
          content: "No se pudo crear el emoji.",
        });
      }
      
      await interaction.reply({
        content: `¡Emoji subido al servidor con éxito!`,
        files: [{ attachment: buffer, name: fileName }],
      });
    }else {
      await interaction.reply({
        content: "Comando incorrecto",
      });
    }
  } catch (error) {
    console.error("Error processing interaction:", error);
    await interaction.reply("Hubo un error al procesar tu solicitud.");
  }
});



client.login(token);

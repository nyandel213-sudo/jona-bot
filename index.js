require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.queues = new Map(); // { guildId: { songs[], player, connection, current, textChannel } }

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') && !f.startsWith('_'));
const commandsData = [];

for (const file of commandFiles) {
  const exported = require(path.join(commandsPath, file));
  const list = Array.isArray(exported) ? exported : [exported];
  for (const command of list) {
    client.commands.set(command.data.name, command);
    commandsData.push(command.data.toJSON());
  }
}

client.once('ready', async () => {
  console.log(`✅ Jona Bot listo como ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData }
    );
    console.log('✅ Slash commands registrados');
  } catch (err) {
    console.error('❌ Error registrando comandos:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const msg = { content: '❌ Ocurrió un error ejecutando ese comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

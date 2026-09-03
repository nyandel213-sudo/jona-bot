require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { LavalinkManager } = require('lavalink-client');
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

client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: 'heavencloud-eu',
      host: 'eu.lavalink.heavencloud.in',
      port: 443,
      authorization: 'heavencloud',
      secure: true,
    },
  ],
  sendToShard: (guildId, payload) =>
    client.guilds.cache.get(guildId)?.shard?.send(payload),
  client: { id: '' },
});

client.on('raw', (d) => client.lavalink.sendRawData(d));

client.lavalink.nodeManager
  .on('connect', (node) => console.log(`✅ Lavalink conectado: ${node.id}`))
  .on('error', (node, error) =>
    console.error(`❌ Error de Lavalink (${node.id}):`, error)
  );

client.lavalink
  .on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textChannelId);
    if (channel) {
      channel.send({
        embeds: [{
          color: 0x1db954,
          title: '▶️ Reproduciendo ahora',
          description: `**[${track.info.title}](${track.info.uri})**`,
          thumbnail: track.info.artworkUrl ? { url: track.info.artworkUrl } : undefined,
          footer: { text: 'Jona Bot 🎵' },
        }],
      });
    }
  })
  .on('queueEnd', (player) => {
    const channel = client.channels.cache.get(player.textChannelId);
    if (channel) channel.send('✅ Cola terminada.');
    player.destroy();
  });

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((f) => f.endsWith('.js') && !f.startsWith('_'));
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

  await client.lavalink.init({
    id: client.user.id,
    username: client.user.username,
  });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commandsData,
    });
    console.log('✅ Slash commands registrados');
  } catch (err) {
    console.error('❌ Error registrando comandos:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) return;
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const msg = {
      content: '❌ Ocurrió un error ejecutando ese comando.',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

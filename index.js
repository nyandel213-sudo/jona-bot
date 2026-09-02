require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
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

client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new YtDlpPlugin({ update: false }),
  ],
});

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

client.distube
  .on('playSong', (queue, song) => {
    if (queue.textChannel) {
      queue.textChannel.send({
        embeds: [{
          color: 0x1DB954,
          title: '▶️ Reproduciendo ahora',
          description: `**[${song.name}](${song.url})**`,
          thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          fields: [{ name: '⏱ Duración', value: song.formattedDuration || 'Desconocida', inline: true }],
          footer: { text: 'Jona Bot 🎵' },
        }],
      });
    }
  })
  .on('addSong', (queue, song) => {
    if (queue.textChannel) {
      queue.textChannel.send({
        embeds: [{
          color: 0x5865F2,
          title: '➕ Añadido a la cola',
          description: `**[${song.name}](${song.url})**`,
          thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          fields: [
            { name: '⏱ Duración', value: song.formattedDuration || 'Desconocida', inline: true },
            { name: '📋 Posición en cola', value: `#${queue.songs.length - 1}`, inline: true },
          ],
        }],
      });
    }
  })
  .on('empty', (queue) => {
    if (queue.textChannel) queue.textChannel.send('👋 Canal de voz vacío, saliendo...');
  })
  .on('initQueue', (queue) => {
    console.log('🔍 initQueue disparado, buscando conexión de voz...');
    const voice = client.distube.voices.get(queue.id);
    if (voice && voice.connection) {
      console.log('🔍 Conexión de voz encontrada, escuchando cambios de estado...');
      voice.connection.on('stateChange', (oldState, newState) => {
        console.log(`🔍 Voice state: ${oldState.status} -> ${newState.status}`);
        if (newState.networking) {
          console.log(`🔍 Networking state: ${newState.networking.state?.code}`);
        }
      });
      voice.connection.on('debug', (msg) => console.log('🔍 Voice debug:', msg));
    } else {
      console.log('🔍 No se encontró la conexión de voz todavía.');
    }
  })
  .on('finish', (queue) => {
    if (queue.textChannel) queue.textChannel.send('✅ Cola terminada.');
  })
  .on('disconnect', (queue) => {
    if (queue.textChannel) queue.textChannel.send('👋 Desconectado del canal de voz.');
  })
  .on('searchNoResult', (message, query) => {
    const channel = message?.channel || message;
    if (channel?.send) channel.send(`❌ No encontré resultados para **${query}**.`);
  })
  .on('error', (channelOrQueue, error) => {
    console.error('❌ DisTube error:', error);
    const channel = channelOrQueue?.textChannel || channelOrQueue;
    if (channel?.send) {
      channel.send('❌ Ocurrió un error reproduciendo esa canción. Puede que YouTube esté bloqueando temporalmente la petición, intenta de nuevo.').catch(() => {});
    }
  });

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
  if (interaction.isButton()) return;

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

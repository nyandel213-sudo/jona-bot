require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ChannelType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const fs = require('fs');
const path = require('path');

// ── Cliente de Discord ────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ── DisTube ───────────────────────────────────────────────────────────────────
client.distube = new DisTube(client, {
  plugins: [
    new YtDlpPlugin({ update: false }),
    new SpotifyPlugin(),
  ],
});

// ── Eventos de DisTube ────────────────────────────────────────────────────────
client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel?.send({
      embeds: [{
        color: 0x1db954,
        title: '▶️ Reproduciendo ahora',
        description: `**[${song.name}](${song.url})**`,
        fields: [
          { name: '⏱ Duración', value: song.formattedDuration, inline: true },
          { name: '👤 Pedido por', value: song.user?.toString() ?? 'Desconocido', inline: true },
        ],
        thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
        footer: { text: 'Jona Bot 🎵' },
      }],
    });
  })
  .on('addSong', (queue, song) => {
    queue.textChannel?.send({
      embeds: [{
        color: 0x3498db,
        title: '➕ Canción agregada',
        description: `**[${song.name}](${song.url})**`,
        fields: [
          { name: '⏱ Duración', value: song.formattedDuration, inline: true },
          { name: '📋 Posición en cola', value: `#${queue.songs.length}`, inline: true },
        ],
        footer: { text: 'Jona Bot 🎵' },
      }],
    });
  })
  .on('addList', (queue, playlist) => {
    queue.textChannel?.send({
      embeds: [{
        color: 0x9b59b6,
        title: '📋 Lista agregada',
        description: `**${playlist.name}** — ${playlist.songs.length} canciones`,
        footer: { text: 'Jona Bot 🎵' },
      }],
    });
  })
  .on('finish', (queue) => {
    queue.textChannel?.send('✅ Cola terminada. ¡Hasta la próxima!');
  })
  .on('disconnect', (queue) => {
    queue.textChannel?.send('👋 Desconectado del canal de voz.');
  })
  .on('error', (channel, error) => {
    console.error('❌ Error de DisTube:', error);
    channel?.send(`❌ Error: ${error.message}`);
  });

// ── Stage Channel: intervalo que garantiza speaker sin pausas ─────────────────
//
// Cada 3 segundos revisa si el bot está en un Stage y suprimido.
// Si lo está, lo reactiva. Esto cubre los casos donde voiceStateUpdate
// no dispara correctamente entre canciones.
//
setInterval(async () => {
  for (const guild of client.guilds.cache.values()) {
    const me = guild.members.me;
    if (!me?.voice?.channel) continue;
    if (me.voice.channel.type !== ChannelType.GuildStageVoice) continue;
    if (!me.voice.suppress) continue; // ya es speaker, no hacer nada

    try {
      await me.voice.setSuppressed(false);
      console.log(`🎤 Stage: bot reactivado como speaker en ${guild.name}`);
    } catch {
      // Sin permisos — no se puede hacer nada
    }
  }
}, 3000);

// ── Cargar comandos ───────────────────────────────────────────────────────────
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

// ── Evento ready ──────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ Jona Bot listo como ${client.user.tag}`);

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

// ── Manejar interacciones ─────────────────────────────────────────────────────
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

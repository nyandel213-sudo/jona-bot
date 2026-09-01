const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const playdl = require('play-dl');

// ─── Resolver la canción ───────────────────────────────────────────────────
async function resolveQuery(query) {
  // Link de Spotify
  if (query.includes('spotify.com')) {
    const spotifyData = await playdl.spotify(query);
    if (!spotifyData) return null;

    let searchQuery;
    if (spotifyData.type === 'track') {
      searchQuery = `${spotifyData.name} ${spotifyData.artists[0]?.name || ''}`;
    } else {
      return null; // playlists/albums no soportados aún
    }

    const results = await playdl.search(searchQuery, { source: { youtube: 'video' }, limit: 1 });
    if (!results.length) return null;
    const video = results[0];
    return {
      title: video.title,
      url: video.url,
      duration: formatDuration(video.durationInSec),
      thumbnail: video.thumbnails[0]?.url,
    };
  }

  // Link de YouTube
  if (query.includes('youtube.com') || query.includes('youtu.be')) {
    const info = await playdl.video_info(query);
    if (!info) return null;
    return {
      title: info.video_details.title,
      url: query,
      duration: formatDuration(info.video_details.durationInSec),
      thumbnail: info.video_details.thumbnails[0]?.url,
    };
  }

  // Búsqueda por nombre
  const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
  if (!results.length) return null;
  const video = results[0];
  return {
    title: video.title,
    url: video.url,
    duration: formatDuration(video.durationInSec),
    thumbnail: video.thumbnails[0]?.url,
  };
}

function formatDuration(seconds) {
  if (!seconds) return 'Desconocida';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Reproducir siguiente canción ─────────────────────────────────────────
async function playNext(guildId, client) {
  const queue = client.queues.get(guildId);
  if (!queue || queue.songs.length === 0) {
    if (queue?.connection) queue.connection.destroy();
    client.queues.delete(guildId);
    return;
  }

  const song = queue.songs.shift();
  queue.current = song;

  try {
    const stream = await playdl.stream(song.url, { quality: 2 });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    queue.player.play(resource);

    queue.player.once(AudioPlayerStatus.Idle, () => {
      playNext(guildId, client);
    });

    queue.player.on('error', (err) => {
      console.error('❌ Player error:', err.message);
      playNext(guildId, client);
    });

    if (queue.textChannel) {
      queue.textChannel.send({
        embeds: [{
          color: 0x1DB954,
          title: '▶️ Reproduciendo ahora',
          description: `**[${song.title}](${song.url})**`,
          thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          fields: [{ name: '⏱ Duración', value: song.duration || 'Desconocida', inline: true }],
          footer: { text: 'Jona Bot 🎵' },
        }]
      });
    }
  } catch (err) {
    console.error('❌ Error reproduciendo:', err.message);
    if (queue.textChannel) {
      queue.textChannel.send(`❌ Error reproduciendo **${song.title}**, saltando...`);
    }
    playNext(guildId, client);
  }
}

// ─── Exportar función para otros archivos ─────────────────────────────────
module.exports.playNext = playNext;

// ─── Comando /play ────────────────────────────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción de YouTube o Spotify')
    .addStringOption(opt =>
      opt.setName('cancion')
        .setDescription('Nombre, link de YouTube o link de Spotify')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.editReply('❌ Tienes que estar en un canal de voz primero.');
    }

    const query = interaction.options.getString('cancion');

    let song;
    try {
      song = await resolveQuery(query);
    } catch (err) {
      console.error('Error resolviendo canción:', err.message);
      return interaction.editReply('❌ No pude encontrar esa canción. Intenta con otro nombre o link.');
    }

    if (!song) {
      return interaction.editReply('❌ No encontré esa canción. Intenta con otro nombre o link.');
    }

    const guildId = interaction.guildId;
    let queue = client.queues.get(guildId);

    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      } catch {
        connection.destroy();
        return interaction.editReply('❌ No pude conectarme al canal de voz.');
      }

      // Si es canal de Stage, pedir hablar y convertirse en speaker
      try {
        const me = interaction.guild.members.me;
        if (voiceChannel.type === 13) { // Stage channel
          await me.voice.setSuppressed(false);
        }
      } catch (e) {
        // ignorar si falla
      }

      const player = createAudioPlayer();
      connection.subscribe(player);

      queue = {
        songs: [],
        player,
        connection,
        current: null,
        textChannel: interaction.channel,
      };

      client.queues.set(guildId, queue);
      queue.songs.push(song);

      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          title: '🎵 Añadido a la cola',
          description: `**[${song.title}](${song.url})**`,
          thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          fields: [{ name: '⏱ Duración', value: song.duration || 'Desconocida', inline: true }],
        }]
      });

      playNext(guildId, client);

    } else {
      queue.songs.push(song);
      await interaction.editReply({
        embeds: [{
          color: 0x5865F2,
          title: '➕ Añadido a la cola',
          description: `**[${song.title}](${song.url})**`,
          thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          fields: [
            { name: '⏱ Duración', value: song.duration || 'Desconocida', inline: true },
            { name: '📋 Posición en cola', value: `#${queue.songs.length}`, inline: true },
          ],
        }]
      });
    }
  }
};

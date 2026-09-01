const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

// ─── /skip ─────────────────────────────────────────────────────────────────
const skip = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.current) return interaction.reply('❌ No hay nada reproduciendo.');
    queue.player.stop();
    await interaction.reply('⏭️ Canción saltada.');
  }
};

// ─── /pause ────────────────────────────────────────────────────────────────
const pause = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la música'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.current) return interaction.reply('❌ No hay nada reproduciendo.');
    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      return interaction.reply('⚠️ Ya está pausado. Usa `/resume` para reanudar.');
    }
    queue.player.pause();
    await interaction.reply('⏸️ Música pausada.');
  }
};

// ─── /resume ───────────────────────────────────────────────────────────────
const resume = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la música pausada'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue || !queue.current) return interaction.reply('❌ No hay nada reproduciendo.');
    if (queue.player.state.status !== AudioPlayerStatus.Paused) {
      return interaction.reply('⚠️ La música no está pausada.');
    }
    queue.player.unpause();
    await interaction.reply('▶️ Música reanudada.');
  }
};

// ─── /stop ─────────────────────────────────────────────────────────────────
const stop = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Para la música y borra la cola'),
  async execute(interaction, client) {
    const queue = client.queues.get(interaction.guildId);
    if (!queue) return interaction.reply('❌ No hay nada reproduciendo.');
    queue.songs = [];
    queue.player.stop();
    queue.connection.destroy();
    client.queues.delete(interaction.guildId);
    await interaction.reply('⏹️ Música detenida y cola borrada. ¡Hasta luego!');
  }
};

// ─── /queue ────────────────────────────────────────────────────────────────
const queue = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  async execute(interaction, client) {
    const q = client.queues.get(interaction.guildId);
    if (!q || (!q.current && q.songs.length === 0)) {
      return interaction.reply('📭 La cola está vacía.');
    }

    const lines = [];
    if (q.current) {
      lines.push(`**▶️ Reproduciendo:** [${q.current.title}](${q.current.url}) \`${q.current.duration || '??'}\``);
    }
    if (q.songs.length > 0) {
      lines.push('');
      lines.push('**📋 En cola:**');
      q.songs.slice(0, 10).forEach((s, i) => {
        lines.push(`\`${i + 1}.\` [${s.title}](${s.url}) \`${s.duration || '??'}\``);
      });
      if (q.songs.length > 10) {
        lines.push(`\n*...y ${q.songs.length - 10} canciones más*`);
      }
    }

    await interaction.reply({
      embeds: [{
        color: 0x5865F2,
        title: '🎵 Cola de canciones',
        description: lines.join('\n'),
        footer: { text: `${q.songs.length} cancion(es) esperando` }
      }]
    });
  }
};

// ─── /np ───────────────────────────────────────────────────────────────────
const np = {
  data: new SlashCommandBuilder()
    .setName('np')
    .setDescription('Muestra la canción que suena ahora'),
  async execute(interaction, client) {
    const q = client.queues.get(interaction.guildId);
    if (!q || !q.current) return interaction.reply('❌ No hay nada reproduciendo ahora mismo.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pause_btn').setLabel('⏸ Pausar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('skip_btn').setLabel('⏭ Saltar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stop_btn').setLabel('⏹ Stop').setStyle(ButtonStyle.Danger),
    );

    const msg = await interaction.reply({
      embeds: [{
        color: 0x1DB954,
        title: '▶️ Sonando ahora',
        description: `**[${q.current.title}](${q.current.url})**`,
        thumbnail: q.current.thumbnail ? { url: q.current.thumbnail } : undefined,
        fields: [
          { name: '⏱ Duración', value: q.current.duration || 'Desconocida', inline: true },
          { name: '📋 En cola', value: `${q.songs.length} cancion(es)`, inline: true },
        ],
        footer: { text: 'Jona Bot 🎵' }
      }],
      components: [row],
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({ time: 60_000 });
    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '❌ Solo quien usó /np puede usar estos botones.', ephemeral: true });
      }
      const qNow = client.queues.get(interaction.guildId);
      if (!qNow) return btn.reply({ content: '❌ No hay nada reproduciendo.', ephemeral: true });

      if (btn.customId === 'pause_btn') {
        qNow.player.pause();
        await btn.reply('⏸️ Pausado.');
      } else if (btn.customId === 'skip_btn') {
        qNow.player.stop();
        await btn.reply('⏭️ Saltado.');
      } else if (btn.customId === 'stop_btn') {
        qNow.songs = [];
        qNow.player.stop();
        qNow.connection.destroy();
        client.queues.delete(interaction.guildId);
        await btn.reply('⏹️ Música detenida.');
      }
    });
  }
};

module.exports = [skip, pause, resume, stop, queue, np];

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ─── /skip ─────────────────────────────────────────────────────────────────
const skip = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply('❌ No hay nada reproduciendo.');
    try {
      await queue.skip();
      await interaction.reply('⏭️ Canción saltada.');
    } catch (err) {
      // No hay siguiente canción: DisTube ya terminó/limpió la cola
      await interaction.reply('⏭️ Era la última canción, la cola terminó.');
    }
  }
};

// ─── /pause ────────────────────────────────────────────────────────────────
const pause = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la música'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply('❌ No hay nada reproduciendo.');
    if (queue.paused) return interaction.reply('⚠️ Ya está pausado. Usa `/resume` para reanudar.');
    queue.pause();
    await interaction.reply('⏸️ Música pausada.');
  }
};

// ─── /resume ───────────────────────────────────────────────────────────────
const resume = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la música pausada'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply('❌ No hay nada reproduciendo.');
    if (!queue.paused) return interaction.reply('⚠️ La música no está pausada.');
    queue.resume();
    await interaction.reply('▶️ Música reanudada.');
  }
};

// ─── /stop ─────────────────────────────────────────────────────────────────
const stop = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Para la música y borra la cola'),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply('❌ No hay nada reproduciendo.');
    queue.stop();
    await interaction.reply('⏹️ Música detenida y cola borrada. ¡Hasta luego!');
  }
};

// ─── /queue ────────────────────────────────────────────────────────────────
const queueCmd = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  async execute(interaction, client) {
    const q = client.distube.getQueue(interaction.guildId);
    if (!q || q.songs.length === 0) {
      return interaction.reply('📭 La cola está vacía.');
    }

    const [current, ...rest] = q.songs;
    const lines = [];
    lines.push(`**▶️ Reproduciendo:** [${current.name}](${current.url}) \`${current.formattedDuration || '??'}\``);

    if (rest.length > 0) {
      lines.push('');
      lines.push('**📋 En cola:**');
      rest.slice(0, 10).forEach((s, i) => {
        lines.push(`\`${i + 1}.\` [${s.name}](${s.url}) \`${s.formattedDuration || '??'}\``);
      });
      if (rest.length > 10) {
        lines.push(`\n*...y ${rest.length - 10} canciones más*`);
      }
    }

    await interaction.reply({
      embeds: [{
        color: 0x5865F2,
        title: '🎵 Cola de canciones',
        description: lines.join('\n'),
        footer: { text: `${rest.length} cancion(es) esperando` }
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
    const q = client.distube.getQueue(interaction.guildId);
    if (!q || !q.songs[0]) return interaction.reply('❌ No hay nada reproduciendo ahora mismo.');

    const current = q.songs[0];

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pause_btn').setLabel('⏸ Pausar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('skip_btn').setLabel('⏭ Saltar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stop_btn').setLabel('⏹ Stop').setStyle(ButtonStyle.Danger),
    );

    const msg = await interaction.reply({
      embeds: [{
        color: 0x1DB954,
        title: '▶️ Sonando ahora',
        description: `**[${current.name}](${current.url})**`,
        thumbnail: current.thumbnail ? { url: current.thumbnail } : undefined,
        fields: [
          { name: '⏱ Duración', value: current.formattedDuration || 'Desconocida', inline: true },
          { name: '📋 En cola', value: `${q.songs.length - 1} cancion(es)`, inline: true },
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
      const qNow = client.distube.getQueue(interaction.guildId);
      if (!qNow) return btn.reply({ content: '❌ No hay nada reproduciendo.', ephemeral: true });

      if (btn.customId === 'pause_btn') {
        qNow.pause();
        await btn.reply('⏸️ Pausado.');
      } else if (btn.customId === 'skip_btn') {
        try {
          await qNow.skip();
          await btn.reply('⏭️ Saltado.');
        } catch {
          await btn.reply('⏭️ Era la última canción, la cola terminó.');
        }
      } else if (btn.customId === 'stop_btn') {
        qNow.stop();
        await btn.reply('⏹️ Música detenida.');
      }
    });
  }
};

module.exports = [skip, pause, resume, stop, queueCmd, np];

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sonando')
    .setDescription('Muestra qué está sonando ahora'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });

    const song = queue.songs[0];
    const currentTime = queue.currentTime;

    // Barra de progreso
    const barLength = 20;
    const progress = song.duration > 0 ? currentTime / song.duration : 0;
    const filled = Math.round(progress * barLength);
    const bar = '▓'.repeat(filled) + '░'.repeat(barLength - filled);

    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return `${m}:${sec}`;
    };

    await interaction.reply({
      embeds: [{
        color: 0x1db954,
        title: '🎵 Sonando ahora',
        description: `**[${song.name}](${song.url})**\n\n\`${bar}\`\n${fmt(currentTime)} / ${song.formattedDuration}`,
        thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
        fields: [
          { name: '👤 Pedido por', value: song.user?.toString() ?? 'Desconocido', inline: true },
          { name: '🔁 Loop', value: queue.repeatMode === 1 ? 'Canción' : queue.repeatMode === 2 ? 'Cola' : 'Off', inline: true },
          { name: '🔊 Volumen', value: `${queue.volume}%`, inline: true },
        ],
        footer: { text: 'Jona Bot 🎵' },
      }],
    });
  },
};

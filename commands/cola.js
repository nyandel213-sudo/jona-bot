const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cola')
    .setDescription('Muestra la cola de canciones'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ La cola está vacía.', ephemeral: true });
    }

    const songs = queue.songs;
    const maxVisible = 10;
    const current = songs[0];

    const lista = songs
      .slice(1, maxVisible + 1)
      .map((s, i) => `**${i + 1}.** [${s.name}](${s.url}) — ${s.formattedDuration}`)
      .join('\n') || '_No hay más canciones en cola._';

    const restantes = songs.length - 1 - maxVisible;

    await interaction.reply({
      embeds: [{
        color: 0x1db954,
        title: '📋 Cola de canciones',
        fields: [
          {
            name: '▶️ Reproduciendo ahora',
            value: `[${current.name}](${current.url}) — ${current.formattedDuration}`,
          },
          {
            name: `📜 Siguiente${songs.length > 2 ? 's' : ''} (${songs.length - 1} en cola)`,
            value: lista,
          },
          ...(restantes > 0
            ? [{ name: '\u200b', value: `_...y ${restantes} canciones más._` }]
            : []),
        ],
        footer: { text: 'Jona Bot 🎵' },
      }],
    });
  },
};

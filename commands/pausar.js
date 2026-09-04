const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('pausar')
      .setDescription('Pausa la canción actual'),

    async execute(interaction, client) {
      const queue = client.distube.getQueue(interaction.guildId);
      if (!queue) return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });
      if (queue.paused) return interaction.reply({ content: '⚠️ Ya está pausado.', ephemeral: true });

      queue.pause();
      await interaction.reply('⏸️ Música pausada.');
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('reanudar')
      .setDescription('Reanuda la música pausada'),

    async execute(interaction, client) {
      const queue = client.distube.getQueue(interaction.guildId);
      if (!queue) return interaction.reply({ content: '❌ No hay nada en cola.', ephemeral: true });
      if (!queue.paused) return interaction.reply({ content: '⚠️ La música no está pausada.', ephemeral: true });

      queue.resume();
      await interaction.reply('▶️ Música reanudada.');
    },
  },
];

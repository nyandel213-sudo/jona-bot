const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saltar')
    .setDescription('Salta la canción actual'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });

    try {
      await queue.skip();
      await interaction.reply('⏭️ Canción saltada.');
    } catch (err) {
      await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
    }
  },
};

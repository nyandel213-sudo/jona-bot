const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('parar')
    .setDescription('Para la música y borra la cola'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ No hay nada reproduciéndose.', ephemeral: true });

    await queue.stop();
    await interaction.reply('⏹️ Música parada y cola borrada.');
  },
};

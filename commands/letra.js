const { SlashCommandBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('letra')
    .setDescription('Muestra la letra de la canción actual o de la que busques')
    .addStringOption((opt) =>
      opt
        .setName('cancion')
        .setDescription('Nombre de la canción a buscar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    let query = interaction.options.getString('cancion');

    if (!query) {
      const queue = client.distube.getQueue(interaction.guildId);
      if (!queue) {
        return interaction.editReply('❌ No hay nada reproduciéndose y no escribiste una canción.');
      }
      query = queue.songs[0].name;
    }

    try {
      const geniusClient = new Genius.Client(process.env.GENIUS_TOKEN);
      const searches = await geniusClient.songs.search(query);

      if (!searches.length) {
        return interaction.editReply(`❌ No encontré letra para: **${query}**`);
      }

      const song = searches[0];
      const lyrics = await song.lyrics();

      if (!lyrics) {
        return interaction.editReply('❌ No pude obtener la letra de esa canción.');
      }

      // Discord tiene límite de 4096 chars en embeds
      const maxLen = 3900;
      const lyricsText = lyrics.length > maxLen
        ? lyrics.slice(0, maxLen) + '\n\n_...letra recortada por longitud._'
        : lyrics;

      await interaction.editReply({
        embeds: [{
          color: 0xf1c40f,
          title: `📝 ${song.title}`,
          description: lyricsText,
          url: song.url,
          footer: { text: 'Fuente: Genius • Jona Bot 🎵' },
        }],
      });
    } catch (err) {
      console.error('Error buscando letra:', err);
      await interaction.editReply('❌ Error al buscar la letra. Intenta de nuevo.');
    }
  },
};

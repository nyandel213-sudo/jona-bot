const { SlashCommandBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

const GeniusClient = new Genius.Client(process.env.GENIUS_TOKEN);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('letra')
    .setDescription('Muestra la letra de la canción actual o de una que busques')
    .addStringOption(opt =>
      opt.setName('cancion')
        .setDescription('Nombre de la canción (opcional, si no busca la que suena)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    let query = interaction.options.getString('cancion');

    if (!query) {
      const queue = client.queues.get(interaction.guildId);
      if (!queue || !queue.current) {
        return interaction.editReply('❌ No hay ninguna canción sonando. Usa `/letra <nombre>` para buscar.');
      }
      query = queue.current.title;
    }

    try {
      const searches = await GeniusClient.songs.search(query);
      if (!searches || searches.length === 0) {
        return interaction.editReply(`❌ No encontré letra para **${query}**.`);
      }

      const song = searches[0];
      const lyrics = await song.lyrics();

      if (!lyrics) {
        return interaction.editReply(`❌ No pude obtener la letra de **${song.title}**.`);
      }

      const chunks = splitLyrics(lyrics, 3900);

      await interaction.editReply({
        embeds: [{
          color: 0xFFD700,
          title: `📜 ${song.title} — ${song.artist.name}`,
          description: chunks[0],
          thumbnail: { url: song.image },
          footer: { text: chunks.length > 1 ? `Página 1/${chunks.length} · Fuente: Genius` : 'Fuente: Genius' }
        }]
      });

      for (let i = 1; i < Math.min(chunks.length, 3); i++) {
        await interaction.followUp({
          embeds: [{
            color: 0xFFD700,
            description: chunks[i],
            footer: { text: `Página ${i + 1}/${chunks.length}` }
          }]
        });
      }

    } catch (err) {
      console.error('Genius error:', err);
      return interaction.editReply('❌ Error al buscar la letra. Verifica tu `GENIUS_TOKEN` en Railway.');
    }
  }
};

function splitLyrics(text, maxLen) {
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > maxLen) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

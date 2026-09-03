const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción de YouTube, Spotify o una búsqueda por nombre')
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

    const rawQuery = interaction.options.getString('cancion');

    // Si no es un link (YouTube, Spotify, SoundCloud, etc.), usamos el
    // prefijo "ytsearch:" para que sea yt-dlp quien busque en YouTube, en
    // vez del buscador interno de DisTube (@distube/ytsr), que está
    // desactualizado y suele romperse cuando YouTube cambia su página.
    const isUrl = /^https?:\/\//i.test(rawQuery);
    const query = isUrl ? rawQuery : `ytsearch:${rawQuery}`;

    try {
      // client.distube.play se encarga de: unirse al canal, resolver el link
      // o búsqueda (YouTube/Spotify/SoundCloud), descargar con yt-dlp,
      // y encolar o reproducir. Los mensajes de "reproduciendo ahora" y
      // "añadido a la cola" los mandan los eventos playSong/addSong en index.js.
      await client.distube.play(voiceChannel, query, {
        textChannel: interaction.channel,
        member: interaction.member,
      });

      await interaction.editReply(`🔎 Buscando **${rawQuery}**...`);
    } catch (err) {
      console.error('❌ Error en /play:', err);
      await interaction.editReply('❌ No pude reproducir esa canción. Intenta con otro nombre o link.');
    }
  }
};

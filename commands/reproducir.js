const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reproducir')
    .setDescription('Reproduce una canción o lista de reproducción')
    .addStringOption((opt) =>
      opt
        .setName('cancion')
        .setDescription('Nombre, link de YouTube o link de Spotify')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.editReply('❌ Tienes que estar en un canal de voz primero.');
    }

    const query = interaction.options.getString('cancion');

    // Si es Stage channel, verificar permisos antes de intentar reproducir
    if (voiceChannel.type === ChannelType.GuildStageVoice) {
      const me = interaction.guild.members.me;
      const perms = voiceChannel.permissionsFor(me);
      if (!perms.has('MuteMembers') && !perms.has('MoveMembers')) {
        return interaction.editReply(
          '❌ No tengo permisos suficientes en ese Stage channel. Necesito el permiso **"Silenciar miembros"** o **"Mover miembros"** para poder hablar.'
        );
      }
    }

    try {
      await client.distube.play(voiceChannel, query, {
        textChannel: interaction.channel,
        member: interaction.member,
      });
      // El evento playSong / addSong de DisTube envía el embed,
      // solo confirmamos que el comando se recibió.
      await interaction.editReply('🔍 Buscando...');
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ No pude reproducir eso: ${err.message}`);
    }
  },
};

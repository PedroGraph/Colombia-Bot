import { joinVoiceChannel } from '@discordjs/voice';

export function leaveVoiceChannel(message) {
    const botVoiceState = message.guild.members.me.voice; // Estado de voz del bot

    // Verifica si el bot está conectado a un canal de voz
    if (!botVoiceState || !botVoiceState.channel) {
        message.reply('¿Me vas a sacar en donde no estoy? Tú eres como rarito.');
        return;
    }

    const voiceChannel = botVoiceState.channel;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    // Verifica si el único miembro en el canal es el bot
    const members = voiceChannel.members.filter((member) => !member.user.bot);

    if(members.size > 0 && message.content !== '!salir') message.reply('No me puedo ir, hay alguien más escuchándome, cagasten. Sigue y te culeo.');
   
    if(message.content === '!salir') message.reply('¡Nospi, sapos!');
    if(members.size === 0) message.reply('Malparidos me dejaron solo. Hijueputas tenían que ser.');

    console.log('Desconectado del canal de voz.');
    connection.destroy(); 
}

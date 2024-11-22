import { joinVoiceChannel } from '@discordjs/voice';

export function leaveVoiceChannel(message) {
    if (message.member.voice.channel) {
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        connection.destroy();
        console.log('Desconectado del canal de voz.');
        message.reply('¡Nospi sapos!');
    } else {
        message.reply('¿Me vas a sacar en donde no estoy? Tú eres como rarito.');
    }
}


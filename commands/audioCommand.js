import {joinVoiceChannel,createAudioPlayer,createAudioResource,AudioPlayerStatus,VoiceConnectionStatus} from '@discordjs/voice';
import { createAudioResourceFromURL } from '../utils/audioUtils.js';
import { AUDIO_PATHS } from '../utils/config.js';
import { botReply as reply } from '../utils/replyChannel.js';

export async function playAudio(message, audioPath) {

    if (!message.member.voice.channel) return reply(message, "Mascabola, métete en un canal pa' que me escuche. La gente cacorra sí me cae mal.");

    const voiceChannel = message.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    let resource;
    try {
        resource = AUDIO_PATHS[message.content].type === 'radio' ? await createAudioResourceFromURL(audioPath) : createAudioResource(audioPath);
    } catch (error) {
        console.error(`Error al cargar el recurso de audio: ${error.message}`);
        connection.destroy();
        return reply(message, 'Hubo un problema al intentar reproducir el audio.');
    }

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
        console.log(`Reproduciendo audio con el comando ${message.content} por ${message?.author?.tag || message?.user?.tag} en el canal ${voiceChannel.name} dentro del servidor ${voiceChannel.guild.name}`);
        reply(message, AUDIO_PATHS[message.content].message);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio terminado.');
        if (connection.state.status !== VoiceConnectionStatus.Destroyed && audioPath !== AUDIO_PATHS['!radiotiempo'].audio) {
            setTimeout(() => {
                connection.destroy();
                console.log('El bot se ha desconectado automáticamente.');
                reply(message, "Hasta luego, bola e' cachones. 🫵😹");
            }, 10000)
        }
    });

}

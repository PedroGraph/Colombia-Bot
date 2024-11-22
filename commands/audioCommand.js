import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { createAudioResourceFromURL } from '../utils/audioUtils.js';
import { AUDIO_PATHS } from '../utils/config.js';

export async function playAudio(message, audioPath) {
    if (!message.member.voice.channel) {
        return message.reply("Mascabola, métete en un canal pa' que me escuche. La gente cacorra sí me cae mal.");
    }

    const voiceChannel = message.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    let resource;
    try {
        resource = AUDIO_PATHS[message.content].type === 'radio'
            ? await createAudioResourceFromURL(audioPath)
            : createAudioResource(audioPath);
    } catch (error) {
        console.error(`Error al cargar el recurso de audio: ${error.message}`);
        connection.destroy();
        return message.reply('Hubo un problema al intentar reproducir el audio.');
    }

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
        console.log(`Reproduciendo audio con el comando ${message.content} por ${message.author.tag} en el canal ${voiceChannel.name} dentro del servidor ${voiceChannel.guild.name}`);
        message.reply(AUDIO_PATHS[message.content].message);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio terminado.');
        if (
            connection.state.status !== VoiceConnectionStatus.Destroyed &&
            audioPath !== AUDIO_PATHS['!radiotiempo'].audio
        ) {
            connection.destroy();
            console.log('Bot desconectado automáticamente después de terminar el audio.');
        }
    });

    // Si el audio no es "radio", desconéctalo después de un tiempo
    if (AUDIO_PATHS[message.content].type !== 'radio') {
        setTimeout(() => {
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
                console.log(`Desconectado del canal de voz después de ${AUDIO_PATHS[message.content].seg} segundos.`);
            }
        }, AUDIO_PATHS[message.content].seg * 1000);
    }
}

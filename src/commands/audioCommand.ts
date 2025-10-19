import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    AudioResource,
} from '@discordjs/voice';
import { createAudioResourceFromURL } from '../utils/audioUtils';
import { AUDIO_PATHS } from '../utils/config';
import { botReply as reply } from '../utils/replyChannel';

const DISCONNECT_DELAY = 10000;

export async function playAudio(message: any, audioPath: string): Promise<void> {
    const voiceChannel = message.member?.voice?.channel;

    if (!voiceChannel) {
        return reply(message, "Mascabola, métete en un canal pa' que me escuche. La gente cacorra sí me cae mal.");
    }

    const commandKey = message.content as keyof typeof AUDIO_PATHS;
    const audioConfig = AUDIO_PATHS[commandKey];

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = await loadAudioResource(audioPath, audioConfig.type);

        if (!resource) {
            connection.destroy();
            return reply(message, 'Hubo un problema al intentar reproducir el audio.');
        }

        player.play(resource);
        connection.subscribe(player);

        setupPlayerListeners(player, connection, message, voiceChannel, audioConfig, audioPath);
    } catch (error: any) {
        console.error(`Error al cargar el recurso de audio: ${error.message}`);
        return reply(message, 'Hubo un problema al intentar reproducir el audio.');
    }
}

async function loadAudioResource(
    audioPath: string,
    type: string
): Promise<AudioResource<unknown> | undefined> {
    try {
        if (type === 'radio') {
            return await createAudioResourceFromURL(audioPath);
        }
        return createAudioResource(audioPath) ?? undefined;
    } catch (error) {
        console.error(`Error cargando recurso: ${error}`);
        return undefined;
    }
}

function setupPlayerListeners(
    player: any,
    connection: any,
    message: any,
    voiceChannel: any,
    audioConfig: any,
    audioPath: string
): void {
    player.on(AudioPlayerStatus.Playing, () => {
        const authorTag = message?.author?.tag || message?.user?.tag;
        console.log(
            `Reproduciendo: ${message.content} | Usuario: ${authorTag} | Canal: ${voiceChannel.name} | Servidor: ${voiceChannel.guild.name}`
        );
        reply(message, audioConfig.message);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio terminado.');

        if (connection.state.status === VoiceConnectionStatus.Destroyed) {
            return;
        }

        if (audioPath === audioConfig.audio) {
            setTimeout(() => {
                connection.destroy();
                console.log('El bot se ha desconectado automáticamente.');
                reply(message, "Hasta luego, bola e' cachones. 🫵😹");
            }, DISCONNECT_DELAY);
        }
    });

    player.on('error', (error: Error) => {
        console.error(`Error del reproductor: ${error.message}`);
        connection.destroy();
    });
}
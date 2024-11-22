import { AUDIO_PATHS } from '../utils/config.js';
import { playAudio } from './audioCommand.js';

export async function handlePlayCommand(message) {
    const command = message.content.toLowerCase();

    if (AUDIO_PATHS[command] && AUDIO_PATHS[command].audio) {
        await playAudio(message, AUDIO_PATHS[command].audio);
    } else {
        message.reply('¡Comando no reconocido! Usa un comando válido como `!hptamonda`, `!fornicamos` o `!radiotiempo`.');
    }
}
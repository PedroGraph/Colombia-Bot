import { AUDIO_PATHS } from '../utils/config.js';
import { playAudio } from './audioCommand.js';

export async function handlePlayCommand(message: any) {
    const command = message.content.toLowerCase() as keyof typeof AUDIO_PATHS;

    if(command.startsWith('!') && !AUDIO_PATHS[command]){
        message.reply('¡Comando no reconocido! Usa un comando válido como `!hptamonda`, `!fornicamos` o `!radiotiempo`.');
        return false;
    } 
    
    if (AUDIO_PATHS[command] && AUDIO_PATHS[command].audio) {
        await playAudio(message, AUDIO_PATHS[command].audio);
        return true;
    }
    
}

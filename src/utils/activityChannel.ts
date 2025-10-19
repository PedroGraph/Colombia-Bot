import { leaveVoiceChannel } from '../commands/leaveCommand';
import { checkIfOnlyBot } from './onlybot';

export const checkVoiceChannelActivity = (connection: any, activeConnections: any, message: any, voiceChannel: any) => {

    if (!connection) {
        console.log('No hay conexión activa para este servidor.');
        return;
    }

    const onlyBot = checkIfOnlyBot(voiceChannel);

    if (voiceChannel && onlyBot) { 
        console.log('Canal vacío. El bot se desconectará en 15 segundos.');
        setTimeout((any) => {
            if (connection && onlyBot) leaveVoiceChannel(message, activeConnections);  
        }, 15000); 
    }
};
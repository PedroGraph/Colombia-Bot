import { leaveVoiceChannel } from '../commands/leaveCommand.js';
import { checkIfOnlyBot } from './onlybot.js';

export const checkVoiceChannelActivity = (connection, activeConnections, message, voiceChannel) => {

    if (!connection) {
        console.log('No hay conexión activa para este servidor.');
        return;
    }

    const onlyBot = checkIfOnlyBot(voiceChannel);

    if (voiceChannel && onlyBot) { 
        console.log('Canal vacío. El bot se desconectará en 15 segundos.');
        setTimeout(() => {
            if (connection && onlyBot) leaveVoiceChannel(message, activeConnections);  
        }, 15000); 
    }
};
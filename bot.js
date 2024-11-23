import { Client, GatewayIntentBits, VoiceChannel } from 'discord.js';
import { TOKEN } from './utils/config.js';
import { handlePlayCommand } from './commands/playCommand.js';
import { leaveVoiceChannel } from './commands/leaveCommand.js';
import { checkVoiceChannelActivity } from './utils/activityChannel.js';
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Mapa para rastrear conexiones activas
const activeConnections = new Map();

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const command = message.content.toLowerCase();

    if (command === '!salir') leaveVoiceChannel(message, activeConnections);

    const connection = await handlePlayCommand(message);
    
    if (connection) {
        const voiceChannel = message.member.voice.channel;
        activeConnections.set(message.guild.id, connection);
        const intervalId = setInterval(() => {
            const currentConnection = activeConnections.get(message.guild.id);
            if (!currentConnection) {
                clearInterval(intervalId);
                return;
            }
            checkVoiceChannelActivity(connection, activeConnections, message, voiceChannel);
        }, 60000);
    }
    
});

export function setupBot() {
    client.login(TOKEN);
}

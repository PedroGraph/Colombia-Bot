import { Client, GatewayIntentBits } from 'discord.js';
import { TOKEN } from './utils/config.js';
import { handlePlayCommand } from './commands/playCommand.js';
import { leaveVoiceChannel } from './commands/leaveCommand.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const command = message.content.toLowerCase();

    if (command === '!salir') {
        leaveVoiceChannel(message);
    } else if (command.startsWith('!')) {
        await handlePlayCommand(message);
    }
});




export function setupBot() {
    client.login(TOKEN);
}

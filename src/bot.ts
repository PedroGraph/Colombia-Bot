import 'dotenv/config';
import { Client, GatewayIntentBits, REST } from 'discord.js';
import { discordReady, discordMessages, discordInteractions } from './client';

console.log('🤖 Iniciando bot...');
console.log('TOKEN:', process.env.DISCORD_TOKEN ? '✅ Configurado' : '❌ No configurado');
console.log('CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? '✅ Configurado' : '❌ No configurado');

const TOKEN = process.env.DISCORD_TOKEN || '';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';

if (!TOKEN || !CLIENT_ID) {
    throw new Error('DISCORD_TOKEN y DISCORD_CLIENT_ID son requeridos en las variables de entorno');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const activeConnections = new Map();
const rest = new REST({ version: '10' }).setToken(TOKEN);

discordReady({ client, CLIENT_ID, rest });
discordMessages({ client, activeConnections });
discordInteractions({ client, activeConnections });

export function setupBot() {
    console.log('🔌 Conectando bot a Discord...');
    client.login(TOKEN);
}

setupBot();
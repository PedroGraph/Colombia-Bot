import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { discordReady, discordMessages, discordInteractions } from './client.js';
import env from 'dotenv';
env.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
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

discordReady({client, CLIENT_ID, rest, Routes});
discordMessages({client, activeConnections});
discordInteractions({client, activeConnections});

// Exportar setup
export function setupBot() {
    client.login(TOKEN);
}

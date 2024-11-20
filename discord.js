const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;  // Usa el puerto proporcionado por Render o el predeterminado

// Rutas básicas (puedes agregar más rutas si lo necesitas)
app.get('/', (req, res) => {
    res.send('Bot en línea');
});

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const { Readable } = require('stream');
const axios = require('axios');
const env = require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const AUDIO_PATHS = {
    '!monda': path.join(__dirname, 'colombia.mp3'),
    '!viva': path.join(__dirname, 'vivafalcao.mp3'),
    '!radio': 'https://24073.live.streamtheworld.com/RT_CARTAGENAAAC_SC?dist=RtCarWeb',
};

// Función para crear recurso de audio desde URL usando axios
async function createAudioResourceFromURL(url) {
    const response = await axios.get(url, { responseType: 'stream' }); // Usamos 'stream' para obtener un flujo en vivo
    const stream = response.data;  // El flujo de datos de audio
    return createAudioResource(stream); // Crear el recurso de audio desde el stream
}

// Función para reproducir audio
async function playAudio(message, audioPath) {
    if (!message.member.voice.channel) {
        return message.reply('¡Necesitas estar en un canal de voz para usar este comando!');
    }

    const voiceChannel = message.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    let resource;

    if (audioPath.startsWith('http')) {
        resource = await createAudioResourceFromURL(audioPath); // Para URLs (radio)
    } else {
        resource = createAudioResource(audioPath); // Para archivos locales
    }

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
        console.log('Reproduciendo audio...');
    });

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio terminado.');
        // Solo desconectar si no es la radio
        if (audioPath !== AUDIO_PATHS['!radio']) {
            connection.destroy();
        }
    });

    // Solo desconectar después de un tiempo si no es la radio
    if (audioPath !== AUDIO_PATHS['!radio']) {
        setTimeout(() => {
            connection.destroy();
            console.log('Desconectado del canal de voz.');
        }, 10000); // Ajusta el tiempo según el archivo de audio o duración del stream
    }
}

// Función para sacar al bot del canal de voz
function leaveVoiceChannel(message) {
    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    if (connection) {
        connection.destroy(); // Desconectar al bot del canal de voz
        console.log('Desconectado del canal de voz.');
        message.reply('¡Me he desconectado del canal de voz!');
    } else {
        message.reply('No estoy en un canal de voz.');
    }
}

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
    if (AUDIO_PATHS[command]) {
        await playAudio(message, AUDIO_PATHS[command]);
    } else if (command === '!salir') {
        leaveVoiceChannel(message); // Llamar a la función para sacar al bot
    }
});

client.login(TOKEN);

const { Client, GatewayIntentBits, IntentsBitField } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const env = require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN; 
const AUDIO_PATH_MONDA = path.join(__dirname, 'colombia.mp3'); 
const AUDIO_PATH_VIVA = path.join(__dirname, 'vivafalcao.mp3');

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

    if (message.content === '!monda') {
        if (!message.member.voice.channel) {
            return message.reply('¡Necesitas estar en un canal de voz para usar este comando!');
        }

        const voiceChannel = message.member.voice.channel;

        // Conectar al canal de voz
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Reproducir el audio
        const player = createAudioPlayer();
        const resource = createAudioResource(AUDIO_PATH_MONDA);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Reproduciendo audio...');
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio terminado.');
        });

        // Desconectar después de 10 segundos
        setTimeout(() => {
            connection.destroy();
            console.log('Desconectado del canal de voz.');
        }, 17000);
    }

    if (message.content === '!viva') {
        if (!message.member.voice.channel) {
            return message.reply('¡Necesitas estar en un canal de voz para usar este comando!');
        }

        const voiceChannel = message.member.voice.channel;

        // Conectar al canal de voz
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Reproducir el audio
        const player = createAudioPlayer();
        const resource = createAudioResource(AUDIO_PATH_VIVA);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Reproduciendo audio...');
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio terminado.');
        });

        // Desconectar después de 10 segundos
        setTimeout(() => {
            connection.destroy();
            console.log('Desconectado del canal de voz.');
        }, 10000);
    }

    


});

client.login(TOKEN);

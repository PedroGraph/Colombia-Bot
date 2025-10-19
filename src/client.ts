import { deleteAllGlobalCommands } from './utils/globalCommands';
import { commands } from './utils/config';
import { handlePlayCommand } from './commands/playCommand';
import { leaveVoiceChannel } from './commands/leaveCommand';
import { checkVoiceChannelActivity } from './utils/activityChannel';
import { AUDIO_PATHS, AUDIO_PATHS_INTERACTION } from './utils/config';
import {  Routes } from 'discord-api-types/v10';
import { Client } from 'discord.js';

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { captureMp3FromStream } from './utils/captureClip';
import { recognizeBufferMp3 } from './services/audd';

import { setLastRadio } from './utils/lastRadio';

export const discordReady = ({client, CLIENT_ID, rest}: {client: Client, CLIENT_ID: string, rest: any}) => {
    client.once('ready', async () => {
        console.log(`Bot conectado como ${client.user?.tag}`);
        const guilds = client.guilds.cache.map(guild => guild.id);
        try {
            await deleteAllGlobalCommands({ CLIENT_ID, rest });
            console.log('Registrando comandos slash...');
            guilds.forEach(guildId => rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands }));
            console.log('Comandos slash registrados correctamente.');
        } catch (error) {
            console.error('Error al registrar comandos slash:', error);
        }
    });
}

export const discordMessages = ({client, activeConnections}: {client: Client, activeConnections: Map<string, any>}) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const command = message.content.toLowerCase();
    
        if (command === '!salir') leaveVoiceChannel(message, activeConnections);
    
        const connection = await handlePlayCommand(message);
    
        if (connection) {
            const voiceChannel = message.member?.voice.channel;
            activeConnections.set(message.guild!.id, connection);
            const intervalId = setInterval(() => {
                const currentConnection = activeConnections.get(message.guild!.id);
                if (!currentConnection) {
                    clearInterval(intervalId);
                    return;
                }
                checkVoiceChannelActivity(connection, activeConnections, message, voiceChannel);
            }, 60000);
        }
    });
}

export const discordInteractions = ({client, activeConnections}: {client: Client, activeConnections: Map<string, any>}) => {

    const shazamCache = new Map<string, string>();
    const putCache = (value: string) => {
        const id = Math.random().toString(36).slice(2, 10);
        shazamCache.set(id, value);
        setTimeout(() => shazamCache.delete(id), 2 * 60 * 1000);
        return id;
    };

    const shazamMeta = new Map<string, { query: string; link?: string; durationMs?: number }>();
    const putMeta = (id: string, meta: { query: string; link?: string; durationMs?: number }) => {
        shazamMeta.set(id, meta);
        setTimeout(() => shazamMeta.delete(id), 2 * 60 * 1000);
    };
    const getMeta = (id: string) => shazamMeta.get(id);

    const msToMMSS = (ms: number) => {
        const s = Math.round(ms / 1000);
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r.toString().padStart(2, '0')}`;
    };

    client.on('interactionCreate', async (interaction) => {

        if (interaction.isAutocomplete()) {
            const focusedValue = interaction.options.getFocused();
            
            const inters =
                AUDIO_PATHS_INTERACTION[interaction.commandName as keyof typeof AUDIO_PATHS_INTERACTION]
                ?? AUDIO_PATHS_INTERACTION['radio']
                ?? [];
            const filtered = inters.filter(action => action.name.toLowerCase().includes(focusedValue.toLowerCase()));
            await interaction.respond(filtered.slice(0, 25).map(action => ({ name: action.name, value: action.value ?? action.name })));
            return;
        }
        
        if (!interaction.isChatInputCommand()) return;

        const { commandName, options } = interaction;

   
        if (commandName === 'shazam') {
            await interaction.deferReply();

            try {
                const radiosList =
                    (AUDIO_PATHS_INTERACTION as any)['shazam'] ??
                    AUDIO_PATHS_INTERACTION['radio'] ??
                    [];
                    
                const pickedRaw = options.getString('radio', true);
                const picked = String(pickedRaw).toLowerCase().replace(/^!+/, '').trim();

                const entry = radiosList.find((r: any) => {
                    const name = String(r?.name ?? '').toLowerCase().trim();
                    const value = String(r?.value ?? '').toLowerCase().replace(/^!+/, '').trim();
                    return picked === value || picked === name;
                });

                const baseKey = String(entry?.value ?? entry?.name ?? picked)
                    .toLowerCase()
                    .replace(/^!+/, '')
                    .trim();
                const keyWithBang = baseKey.startsWith('!') ? baseKey : `!${baseKey}`;
                const keyPlain = baseKey;

                const radioConfig = (AUDIO_PATHS as any)[keyWithBang] ?? (AUDIO_PATHS as any)[keyPlain];
              
                let url: string | undefined =
                    (typeof radioConfig === 'string' ? radioConfig : undefined) ??
                    radioConfig?.audio ??               // <- tu shape real
                    radioConfig?.stream ??
                    radioConfig?.src ??
                    radioConfig?.path ??
                    entry?.url ??
                    entry?.stream ??
                    entry?.src ??
                    entry?.path;

                if (radioConfig?.type === 'radio' && url && !/^https?:\/\//i.test(url)) {
                    url = undefined;
                }

                if (!url || typeof url !== 'string') {
                    await interaction.editReply(
                        `No encontré la URL del stream para **${pickedRaw}**.\n` +
                        `• El cacorro que hizo esa vaina que vaya a revisar su porquería.\n` 
                    );
                    return;
                }

                const seconds = Math.max(5, Math.min(options.getInteger('segundos') ?? 12, 25));

                const clip = await captureMp3FromStream(url, seconds);
                const result = await recognizeBufferMp3(clip, {
                    returnMeta: 'apple_music,spotify,deezer',
                    market: 'co',
                });

                if (!result) {
                    await interaction.editReply(`No pude identificar la canción en **${pickedRaw}**. Seguro tan hablando mondá.`);
                    return;
                }

                const title = result.title ?? 'Desconocido';
                const artist = result.artist ?? 'Desconocido';
                const albumTxt = result.album ? `**Álbum:** ${result.album}` : null;

                let cover: string | undefined;
                const amArt = result.apple_music?.artwork?.url as string | undefined;
                if (amArt) cover = amArt.replace('{w}x{h}', '512x512');
                else if (result.spotify?.album?.images?.[0]?.url) cover = result.spotify.album.images[0].url;
                else if (result.deezer?.album?.cover_medium) cover = result.deezer.album.cover_medium;

                const durMs = result.apple_music?.durationInMillis ?? result.spotify?.duration_ms;
                const duration = typeof durMs === 'number' ? msToMMSS(durMs) : undefined;

                const songLink =
                    result.spotify?.external_urls?.spotify ??
                    result.apple_music?.url ??
                    result.song_link ??
                    result.deezer?.link;

                const displayTitle = [artist, title].filter(Boolean).join(' - ');
                const durationBadge = duration ? `\`${duration}\`` : '';

                const authorName = 'Oe! Ya sé cuál es ese tema.';

                const requestedBy = interaction.user.toString();
                const connectedIn =
                (interaction.member as any)?.voice?.channel
                    ? (interaction.member as any).voice.channel.toString()
                    : '—';

                const descriptionContent = [
                    durationBadge,
                    cover ? '' : ''
                ].filter(Boolean).join(' ');

                const embed = new EmbedBuilder()
                    .setAuthor({ name: authorName })
                    .setTitle(displayTitle)
                    .setURL(songLink ?? null as any);

                if (descriptionContent.trim()) {
                    embed.setDescription(descriptionContent);
                }

                embed
                    .addFields(
                        { name: 'El vale que lo pidió', value: requestedBy, inline: true },
                        { name: 'Donde pidió esa vaina', value: connectedIn, inline: true },
                    )
                    .setFooter({ text: `Canción identificada en · ${pickedRaw}` })
                    .setTimestamp(new Date());
                  
                if (cover) embed.setThumbnail(cover);

                const toPost = `!play ${title} - ${artist}`;
                const cacheId = putCache(toPost);

                putMeta(cacheId, {
                    query: `${artist} - ${title}`,
                    link: songLink ?? undefined,
                    durationMs: durMs ?? undefined,
                });

                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`shazam:play:${cacheId}`)
                        .setLabel('Play')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('shazam:cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary),
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } catch (err) {
                console.error('/shazam error:', err);
                await interaction.editReply('Hubo un error procesando el stream. Se cayó esa vaina.');
            }
            return;
        }
        // ====== /SHAZAM ======


        await interaction.deferReply();
        const optionName = commandName.toLowerCase() === 'radio' ? 'radio' : 'fornicamos';
        const commandInput = options.getString(optionName, true);
        const audioKey = commandInput.toLowerCase() as keyof typeof AUDIO_PATHS;
        await interaction.editReply(`Reproduciendo: ${(AUDIO_PATHS as any)[audioKey].message}`);

      
        const entry = (AUDIO_PATHS as any)[audioKey];
        const maybeUrl = typeof entry === 'string' ? entry : entry?.audio;
        if (entry?.type === 'radio' && typeof maybeUrl === 'string' && /^https?:\/\//i.test(maybeUrl)) {
            setLastRadio(interaction.guildId!, String(audioKey), maybeUrl);
        }

        const message = interaction;
        const voiceChannel = (interaction.member as any)?.voice?.channel;
        (message as any).content = `${commandInput.toLowerCase()}`;
        const connection = await handlePlayCommand(message as any);
    
        if (!connection) {
            console.error("No se pudo conectar al canal de voz.");
            return;
        }

        activeConnections.set(interaction.guildId!, connection);
        const intervalId = setInterval(() => {
            const currentConnection = activeConnections.get(message.guild!.id);
            if (!currentConnection) {
                clearInterval(intervalId);
                return;
            }
            checkVoiceChannelActivity(connection, activeConnections, message as any, voiceChannel);
        }, 60000);
    });
};
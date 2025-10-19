import {
    ActionRowBuilder,
    AutocompleteInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    TextChannel,
} from "discord.js";
import { AUDIO_PATHS } from "../utils/config";
import { captureMp3FromStream } from "../utils/captureClip";
import { recognizeBufferMp3 } from "../services/audd";

// Cache en memoria para payloads del botón "Play"
const shazamCache = new Map<string, string>();
function putCache(value: string) {
    const id = Math.random().toString(36).slice(2, 10);
    setTimeout(() => shazamCache.delete(id), 2 * 60 * 1000);
    return id;
}
function getCache(id: string) {
    return shazamCache.get(id);
}

type RadioItem = { name: string; url: string };
function getRadios(): RadioItem[] {
    if (Array.isArray((AUDIO_PATHS as any))) {
        return (AUDIO_PATHS as any)
            .map((r: any) => ({ name: String(r.name ?? r.title ?? r.id), url: String(r.url ?? r.src ?? r.stream) }))
            .filter((r: any) => r.name && r.url);
    }
    const obj = AUDIO_PATHS as Record<string, any>;
    return Object.keys(obj).map((k) => ({ name: k, url: obj[k].audio ?? obj[k].url ?? obj[k] }));
}
function findRadioUrlByName(name: string): string | undefined {
    const list = getRadios();
    const hit = list.find(r => r.name.toLowerCase() === name.toLowerCase());
    return hit?.url;
}

export async function handleShazamAutocomplete(inter: AutocompleteInteraction) {
    if (inter.commandName !== "shazam") return;
    const focused = inter.options.getFocused(true);
    if (focused.name !== "radio") return;

    const q = String(focused.value ?? "").toLowerCase();
    const radios = getRadios()
        .filter(r => !q || r.name.toLowerCase().includes(q))
        .slice(0, 25)
        .map(r => ({ name: r.name, value: r.name }));

    await inter.respond(radios);
}

export async function runShazam(interaction: ChatInputCommandInteraction) {
    const radioName = interaction.options.getString("radio", true);
    const seconds = interaction.options.getInteger("segundos") ?? 12;

    const url = findRadioUrlByName(radioName);
    if (!url) {
        await interaction.reply({ content: `No encontré la radio **${radioName}** en AUDIO_PATHS.`, ephemeral: true });
        return;
    }

    await interaction.deferReply();

    try {
        const clip = await captureMp3FromStream(url, Math.max(5, Math.min(seconds, 25)));

        const result = await recognizeBufferMp3(clip, {
            returnMeta: "apple_music,spotify,deezer",
            market: "co",
        });

        if (!result) {
            await interaction.editReply(`No pude identificar la canción en **${radioName}**. Intenta de nuevo.`);
            return;
        }

        const title = result.title ?? "Desconocido";
        const artist = result.artist ?? "Desconocido";
        const albumTxt = result.album ? `**Álbum:** ${result.album}` : null;

        let cover: string | undefined;
        const amArt = result.apple_music?.artwork?.url as string | undefined;
        if (amArt) cover = amArt.replace("{w}x{h}", "512x512");
        else if (result.spotify?.album?.images?.[0]?.url) cover = result.spotify.album.images[0].url;
        else if (result.deezer?.album?.cover_medium) cover = result.deezer.album.cover_medium;

        const durMs = result.apple_music?.durationInMillis ?? result.spotify?.duration_ms;
        const duration = typeof durMs === "number" ? msToMMSS(durMs) : undefined;

        const songLink =
            result.song_link ||
            result.apple_music?.url ||
            result.spotify?.external_urls?.spotify ||
            result.deezer?.link;

        const lines = [
            duration ? `**Duración:** ${duration}` : null,
            result.release_date ? `**Lanzamiento:** ${result.release_date}` : null,
            result.timecode ? `**Posición detectada:** ${result.timecode}` : null,
            albumTxt,
            songLink ? `[Escuchar / Abrir](${songLink})` : null,
        ].filter(Boolean).join("\n");

        const embed = new EmbedBuilder()
            .setTitle(`${title} — ${artist}`)
            .setDescription(lines || " ")
            .setFooter({ text: `Identificado con AudD · ${radioName}` })
            .setTimestamp(new Date());
        if (cover) embed.setThumbnail(cover);

        const toPost = `!play ${title} - ${artist}`;
        const cacheId = putCache(toPost);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`shazam:play:${cacheId}`)
                .setLabel("Play")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`shazam:cancel`)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (err) {
        console.error("/shazam error:", err);
        await interaction.editReply("Hubo un error procesando el stream. Verifica que la URL esté activa/permitida.");
    }
}

function disableButtonsInRow(row: any): ActionRowBuilder<ButtonBuilder> | null {
    if (row.type !== ComponentType.ActionRow) return null;
    const disabledButtons = row.components
        .filter((c: any) => c.type === ComponentType.Button)
        .map((b: any) => new ButtonBuilder(b).setDisabled(true));
    return disabledButtons.length > 0
        ? new ActionRowBuilder<ButtonBuilder>().addComponents(...disabledButtons)
        : null;
}

export async function handleShazamButton(inter: ButtonInteraction) {
    if (inter.customId === "shazam:cancel") {
        const rows = inter.message.components
            ?.map(disableButtonsInRow)
            .filter((r): r is ActionRowBuilder<ButtonBuilder> => r !== null) ?? [];
        await inter.update({ components: rows as any });
        return;
    }

    if (inter.customId.startsWith("shazam:play:")) {
        const id = inter.customId.split(":")[2];
        const payload = getCache(id);
        if (!payload) {
            await inter.reply({ content: "El comando expiró. Vuelve a usar /shazam.", ephemeral: true });
            return;
        }

        // Enviar el mensaje al canal
        const channel = inter.channel as TextChannel;
        if (channel?.send) {
            await channel.send(payload);
        }

        // Deshabilitar botones
        const rows = inter.message.components
            ?.map(disableButtonsInRow)
            .filter((r): r is ActionRowBuilder<ButtonBuilder> => r !== null) ?? [];
        await inter.update({ components: rows as any });
    }
}

function msToMMSS(ms: number) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
}
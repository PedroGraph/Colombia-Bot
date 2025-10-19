import { handlePlayCommand } from "../commands/playCommand";
import type { Guild, GuildMember, TextBasedChannel } from "discord.js";
import { getLastRadio } from "./lastRadio";
import yts from "yt-search";

// ¿Es http(s)?
function isHttpUrl(str?: string): boolean {
  if (!str) return false;
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

const NON_PLAYABLE_HOSTS = new Set([
  "open.spotify.com",
  "music.apple.com",
  "lis.tn",
  "www.deezer.com",
  "deezer.page.link",
]);

type ResolveOpts = {
  primary: string;
  fallbacks?: string[];
  durationMs?: number;
};

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/\([^)]+(official|video|audio|lyrics)[^)]+\)/g, "")
    .replace(/\b(official|video|audio|lyrics|hd|4k)\b/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCandidate(q: string, title: string, author: string, seconds?: number, targetMs?: number) {
  const nq = normalize(q);
  const nt = normalize(title);
  const na = normalize(author);
  let score = 0;

  // contiene palabras de query
  const parts = nq.split(" ");
  let hits = 0;
  for (const p of parts) if (p && (nt.includes(p) || na.includes(p))) hits++;
  score += hits;

  // preferir canales Topic / oficiales
  if (/topic/i.test(author)) score += 2;
  if (/official/i.test(title)) score += 1;

  // duración cercana (±15%)
  if (typeof seconds === "number" && typeof targetMs === "number" && targetMs > 0) {
    const target = targetMs / 1000;
    const diff = Math.abs(seconds - target);
    const tol = Math.max(10, target * 0.15);
    if (diff <= tol) score += 3;
  }

  return score;
}

async function resolvePlayableUrl({ primary, fallbacks, durationMs }: ResolveOpts): Promise<string | null> {
  // 1) si ya es URL y no es host no-reproducible, úsala
  if (isHttpUrl(primary)) {
    try {
      const host = new URL(primary).host;
      if (!NON_PLAYABLE_HOSTS.has(host)) return primary;
    } catch { /* noop */ }
  }

  const candidates: string[] = [];
  const add = (q?: string) => { if (q && !candidates.includes(q)) candidates.push(q); };

  // Queries base
  add(primary);
  (fallbacks ?? []).forEach(add);

  // Variantes enriquecidas
  const extras = ["official audio", "official video", "lyrics", "remaster"];
  const more: string[] = [];
  for (const q of [...candidates]) {
    for (const x of extras) more.push(`${q} ${x}`);
  }
  more.forEach(add);

  // 2) buscar en YouTube con ranking básico
  let best: { url: string, score: number } | null = null;

  for (const q of candidates) {
    try {
      const res = await yts(q);
      for (const v of res.videos ?? []) {
        const sc = scoreCandidate(q, v.title, v.author?.name ?? "", v.seconds, durationMs);
        if (!best || sc > best.score) best = { url: v.url, score: sc };
      }
      if (best && best.score >= 6) break; // suficientemente bueno, corta
    } catch (e) {
      // ignora y prueba siguiente query
    }
  }

  return best?.url ?? null;
}

export async function playTrackThenReturn(opts: {
  guild: Guild,
  member: GuildMember,
  channel: TextBasedChannel | null,
  queryOrUrl: string,
  durationMs?: number,
  activeConnections: Map<string, any>,
  // NUEVO: ayudas opcionales
  fallbackQueries?: string[],
  previewUrl?: string, // Apple/Spotify/Deezer 30s
}) {
  const {
    guild, member, channel,
    queryOrUrl, durationMs, activeConnections,
    fallbackQueries, previewUrl,
  } = opts;

  const last = getLastRadio(guild.id);

  // 1) Resolver URL reproducible (YouTube preferido)
  const ytUrl = await resolvePlayableUrl({
    primary: queryOrUrl,
    fallbacks: fallbackQueries,
    durationMs,
  });

  let playableUrl = ytUrl;

  // 2) Fallback a preview si YouTube no apareció
  // (mejor reproducir 30s que fallar; volveremos a la radio antes)
  let effectiveDurationMs = durationMs;
  if (!playableUrl && previewUrl && isHttpUrl(previewUrl)) {
    playableUrl = previewUrl;
    // previews suelen ser 30s
    effectiveDurationMs = 30_000;
  }

  if (!playableUrl) {
    throw new Error("No encontré una fuente reproducible (YouTube) ni preview disponible.");
  }

  // 3) Reproducir con tu bot
  const fakeMsg: any = { content: playableUrl, guild, member, channel };
  const conn = await handlePlayCommand(fakeMsg);
  if (!conn) throw new Error("No se pudo iniciar reproducción de la canción");

  // 4) Programar regreso a la radio
  let ms = typeof effectiveDurationMs === "number" && effectiveDurationMs > 0
    ? effectiveDurationMs
    : 3 * 60_000; // 3 min fallback
  ms = Math.min(ms + 4000, 15 * 60_000); // gracia + tope

  setTimeout(async () => {
    try {
      if (!last) return;
      const stillConnected = activeConnections.get(guild.id);
      if (!stillConnected) return;

      const backMsg: any = { content: last.url, guild, member, channel };
      await handlePlayCommand(backMsg);
    } catch (e) {
      console.error("Error volviendo a la radio:", e);
    }
  }, ms);
}

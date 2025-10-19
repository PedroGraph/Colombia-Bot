// scripts/play_from_query.ts
import 'dotenv/config';
import {
  ChannelType,
  Client,
  GatewayIntentBits,
  TextBasedChannel,
  VoiceBasedChannel,
} from 'discord.js';
import yts from 'yt-search';
import { handlePlayCommand } from '../src/commands/playCommand';

// ============== CONFIG DE PRUEBA (EDITA) ==============
const HARDCODED_QUERY = 'Juanes - Una Noche Contigo';

const TOKEN    = process.env.DISCORD_TOKEN!;
const GUILD_ID = process.env.TEST_GUILD_ID!;    // o usa el script list_ids.ts que te pasé
const VOICE_ID = process.env.TEST_VOICE_ID!;
const TEXT_ID  = process.env.TEST_TEXT_ID || ''; // opcional
// ======================================================

function assertEnv(cond: any, msg: string): asserts cond {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}
assertEnv(TOKEN, 'Falta DISCORD_TOKEN');
assertEnv(GUILD_ID, 'Falta TEST_GUILD_ID');
assertEnv(VOICE_ID, 'Falta TEST_VOICE_ID');

function isHttpUrl(s?: string): s is string {
  if (!s) return false;
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/\([^)]+(official|video|audio|lyrics)[^)]+\)/g, '')
    .replace(/\b(official|video|audio|lyrics|hd|4k)\b/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function scoreCandidate(q: string, title: string, author: string) {
  const nq = normalize(q), nt = normalize(title), na = normalize(author);
  let score = 0;
  for (const p of nq.split(' ')) if (p && (nt.includes(p) || na.includes(p))) score++;
  if (/topic/i.test(author)) score += 2;
  if (/official/i.test(title)) score += 1;
  return score;
}
async function searchYouTubeUrl(query: string): Promise<string> {
  const candidates = [
    query,
    `${query} official audio`,
    `${query} lyrics`,
    `${query} video`,
  ];
  let best: { url: string, score: number } | null = null;
  for (const q of candidates) {
    const res = await yts(q);
    for (const v of res.videos ?? []) {
      const sc = scoreCandidate(q, v.title, v.author?.name ?? '');
      if (!best || sc > best.score) best = { url: v.url, score: sc };
    }
    if (best && best.score >= 6) break;
  }
  if (!best?.url || !isHttpUrl(best.url)) {
    throw new Error(`No encontré un resultado reproducible en YouTube para: ${query}`);
  }
  return best.url;
}

async function main() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once('ready', async () => {
    try {
      console.log(`✅ Bot listo como ${client.user?.tag}`);
      console.log(`🔎 Buscando en YouTube: ${HARDCODED_QUERY}`);
      const url = await searchYouTubeUrl(HARDCODED_QUERY);
      const cleanUrl = new URL(url).toString(); // Normaliza
      console.log(`🎯 URL encontrada: ${url}`);

      const guild = await client.guilds.fetch(GUILD_ID);

      const voice = await guild.channels.fetch(VOICE_ID);
      if (!voice || !voice.isVoiceBased()) {
        throw new Error('El TEST_VOICE_ID no es un canal de voz válido');
      }
      const voiceChannel = voice as VoiceBasedChannel;

      // Canal de texto real (elige el primero si no pasaste TEST_TEXT_ID)
      let textChannel: TextBasedChannel | null = null;
      if (TEXT_ID) {
        const t = await guild.channels.fetch(TEXT_ID);
        if (t && t.isTextBased()) textChannel = t as TextBasedChannel;
      } else {
        const channels = await guild.channels.fetch();
        const firstText = [...channels.values()].find(
          (c) => c?.type === ChannelType.GuildText || c?.type === ChannelType.GuildAnnouncement
        );
        if (firstText && firstText.isTextBased()) {
          textChannel = firstText as TextBasedChannel;
        }
      }

      const content = cleanUrl; // <-- antes usábamos "!play <url>"; cámbialo a SOLO la URL

      // Mensaje “realista” con las mínimas props que usa tu playCommand
      const fakeMsg: any = {
        content,
        guild,
        client,
        channel: textChannel,
        author: { bot: false, id: '0', username: 'SmokeTest' },
        member: {
          // voz: usa el canal de voz destino
          voice: { channel: voiceChannel },
          // permisos mínimos (si tu comando los consulta)
          permissions: { has: () => true },
        },
        // helpers comunes
        reply: async (payload: any) => {
          if (textChannel && "send" in textChannel && typeof textChannel.send === "function") {
            await textChannel.send(payload);
          } else {
            console.log('💬 [reply]', typeof payload === 'string' ? payload : JSON.stringify(payload));
          }
        },
        react: async () => true,
      };

      console.log(`🎵 Reproduciendo en #${voiceChannel.name}`);
      const connection = await handlePlayCommand(fakeMsg);
      if (!connection) throw new Error('handlePlayCommand no devolvió conexión');

      console.log('✅ Reproducción iniciada. Deja correr el proceso para escuchar.');
    } catch (err) {
      console.error('❌ Error en play_from_query:', err);
      process.exit(1);
    }
  });

  await client.login(TOKEN);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

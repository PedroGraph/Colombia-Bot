import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

async function captureMp3FromStream(url: string, seconds = 12): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("No se encontró ffmpeg-static");
  const ffmpegBin: string = ffmpegPath;

  return new Promise<Buffer>((resolve, reject) => {
    const out = new PassThrough();
    const chunks: Buffer[] = [];

    out.on("data", (c) => chunks.push(c));
    out.on("end", () => resolve(Buffer.concat(chunks)));
    out.on("error", reject);

    ffmpeg({ source: url })
      .setFfmpegPath(ffmpegBin)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioChannels(2)
      .audioFrequency(44100)
      .audioBitrate("128k")
      .duration(seconds)
      .format("mp3")
      .output(out, { end: true })
      .on("error", reject)
      .run();
  });
}

const AUDD_ENDPOINT = "https://api.audd.io/";

async function recognizeBufferMp3(buf: Buffer) {
  const token = process.env.AUDD_TOKEN;
  if (!token) throw new Error("Falta AUDD_TOKEN");

  const form = new FormData();
  form.set("api_token", token);
  form.set("return", "apple_music,spotify,deezer");
  form.set("market", "co");

  // Convierte Buffer a Uint8Array directamente
  const uint8Array = new Uint8Array(buf);
  const file = new File([uint8Array], "clip.mp3", { type: "audio/mpeg" });
  form.set("file", file);

  const res = await fetch(AUDD_ENDPOINT, { method: "POST", body: form });
  const json = await res.json();
  return json;
}

(async () => {
  try {
    const RADIO_URL = process.argv[2] ?? "https://TU_STREAM_DE_PRUEBA.mp3";

    console.log("Capturando 12s de:", RADIO_URL);
    const clip = await captureMp3FromStream(RADIO_URL, 12);

    console.log("Enviando a AudD...");
    const json = await recognizeBufferMp3(clip);

    console.dir(json, { depth: 5 });
    if (json?.status === "success" && json?.result) {
      const r = json.result;
      console.log(`✅ ${r.title ?? "?"} — ${r.artist ?? "?"}`);
      console.log(`Album: ${r.album ?? "-"} | Link: ${r.song_link ?? "-"}`);
      console.log(
        `Duración: ${
          r.apple_music?.durationInMillis
            ? `${Math.round(r.apple_music.durationInMillis / 1000)}s`
            : r.spotify?.duration_ms
            ? `${Math.round(r.spotify.duration_ms / 1000)}s`
            : "N/D"
        }`
      );
    } else {
      console.log("❌ No se pudo identificar.");
    }
  } catch (e) {
    console.error("Error en smoke test:", e);
    process.exit(1);
  }
})();
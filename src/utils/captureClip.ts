import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export async function captureMp3FromStream(url: string, seconds = 12): Promise<Buffer> {
  if (!ffmpegPath) throw new Error("No se encontró ffmpeg-static");

  const ffmpegBin: string = ffmpegPath;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const out = new PassThrough();

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

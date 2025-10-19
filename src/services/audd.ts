const AUDD_ENDPOINT = "https://api.audd.io/";

export interface AudDResult {
  artist?: string;
  title?: string;
  album?: string;
  release_date?: string;
  timecode?: string;
  song_link?: string;
  apple_music?: any;
  spotify?: any;
  deezer?: any;
}

export async function recognizeBufferMp3(
  buf: Buffer,
  opts: { returnMeta?: string; market?: string } = {}
): Promise<AudDResult | null> {
  const token = process.env.AUDD_TOKEN;
  if (!token) throw new Error("Falta AUDD_TOKEN");

  const form = new FormData();
  form.set("api_token", token);
  if (opts.returnMeta) form.set("return", opts.returnMeta);
  if (opts.market) form.set("market", opts.market);

  const uint8Array = new Uint8Array(buf);
  const file = new File([uint8Array], "clip.mp3", { type: "audio/mpeg" });
  form.set("file", file);

  const res = await fetch(AUDD_ENDPOINT, { method: "POST", body: form });
  const json = await res.json();

  if (json?.status === "success" && json?.result) {
    return json.result as AudDResult;
  }

  return null;
}
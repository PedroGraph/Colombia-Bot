// Guarda la última radio reproducida por servidor (guild)
const lastRadio = new Map<string, { key: string; url: string }>();

export function setLastRadio(guildId: string, key: string, url: string) {
  lastRadio.set(guildId, { key, url });
}

export function getLastRadio(guildId: string) {
  return lastRadio.get(guildId);
}

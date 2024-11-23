import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { type } from 'os';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOKEN = process.env.DISCORD_TOKEN;

export const AUDIO_PATHS = {
    '!hptamonda': {
        audio: path.join(__dirname, '../colombia.mp3'),
        message: "Siempre es la misma mondá con esa selección valedora de verga. ¡Culpa de Petro!",
        type: 'audio',
        seg: 17
    },
    '!fornicamos': {
        audio: path.join(__dirname, '../vivafalcao.mp3'),
        message: "¡Viva Colombia! ¡Viva Falcao!, el tigre más fuerte y valiente que tiene la cancha.",
        type: 'audio',
        seg: 10
    },
    '!radiotiempo': {
        audio: 'https://24073.live.streamtheworld.com/RT_CARTAGENAAAC_SC?dist=RtCarWeb',
        message: "Ta sonando la mejor radio de Colombia. RadioTiempo todo el tiempo.",
        type: 'radio'
    },
    '!olimpica':{
        audio: 'https://22823.live.streamtheworld.com/OLP_CARTAGENAAAC?dist=oro_web',
        message: "Yo escucho Olimpica poke me pone de todo.",
        type: 'radio'
    },
    '!lareina':{
        audio: 'https://27353.live.streamtheworld.com/RNA_CARTAGENA_SC',
        message: "Laaaaaaaaaaaaa Reinaaaa.",
        type: 'radio'
    },
    '!tropicana':{
        audio: 'https://24253.live.streamtheworld.com/TR_CARTAGENAAAC_SC?csegid=2000',
        message: "Tropicana, la más bacana.",
        type: 'radio'
    }
};

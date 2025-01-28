import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOKEN = process.env.DISCORD_TOKEN;

export const AUDIO_PATHS = {
    '!hptamonda': {
        audio: path.join(__dirname, '../audios/colombia.mp3'),
        message: "Siempre es la misma mondá con esa selección valedora de verga. ¡Culpa de Petro!",
        type: 'audio',
        seg: 17
    },
    '!fornicamos': {
        audio: path.join(__dirname, '../audios/vivafalcao.mp3'),
        message: "¡Viva Colombia! ¡Viva Falcao!, el tigre más fuerte y valiente que tiene la cancha.",
        type: 'audio',
        seg: 10
    },
    '!goleada':{
        audio: path.join(__dirname, '../audios/ellaesmuyardiente.mp3'),
        message: "Mondá pidieron, mondá llevaron y con ñapa.",
        type: 'audio',
        seg: 15
    },
    '!radiotiempo': {
        audio: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RT_CARTAGENAAAC_SC?dist=RtCarWeb',
        message: "Ta sonando la mejor radio de Colombia. RadioTiempo todo el tiempo.",
        type: 'radio'
    },
    '!olimpica':{
        audio: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OLP_CARTAGENAAAC?dist=oro_web',
        message: "Yo escucho Olimpica poke me pone de todo.",
        type: 'radio'
    },
    '!lareina':{
        audio: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RNA_CARTAGENA_SC',
        message: "Laaaaaaaaaaaaa Reinaaaa.",
        type: 'radio'
    },
    '!tropicana':{
        audio: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TR_CARTAGENAAAC_SC?csegid=2000',
        message: "Tropicana, la más bacana.",
        type: 'radio'
    }
};


export const AUDIO_PATHS_INTERACTION = {
    'radio': [{name: 'Radio Tiempo', value: '!radiotiempo'}, {name: 'Olimpica', value: '!olimpica'}, {name: 'La Reina', value: '!lareina'}, {name: 'Tropicana', value: '!tropicana'}],
    'feeling': [{name: 'Nos fornicaron', value: '!hptamonda'}, {name: 'Fornicamos', value: '!fornicamos'}, {name: 'Ni lo uno ni lo otro', value: '!hptamonda'}, {name: 'Lluvia de mondá llevaron', value: '!goleada'}]
}


export const commands = [
    {
        name: 'feeling', // Nombre del comando sin caracteres especiales
        description: 'Sentimientos decepcionantes o alegres de Colombia',
        options: [
            {
                name: 'fornicamos', // Nombre de la opción sin caracteres especiales
                description: 'Sentimiento del hincha para saber si fornicamos o no',
                type: 3, 
                required: true,
                autocomplete: true,
            },
        ],
    },
    {
        name: 'radio', // Nombre del comando sin caracteres especiales
        description: 'Reproduce una radio en tu canal de voz',
        options: [
            {
                name: 'radio', // Nombre de la opción sin caracteres especiales
                description: 'El nombre o enlace de la radio a reproducir',
                type: 3, // STRING
                required: true,
                autocomplete: true,
            },
        ],
    }
];
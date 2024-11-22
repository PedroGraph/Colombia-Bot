import { createAudioResource } from '@discordjs/voice';
import axios from 'axios';

export async function createAudioResourceFromURL(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    return createAudioResource(response.data);
}



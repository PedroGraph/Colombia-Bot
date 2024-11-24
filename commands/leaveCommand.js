import { getVoiceConnection } from '@discordjs/voice';

export async function leaveVoiceChannel(context) {
    // Determina si es un mensaje o una interacción
    const isInteraction = context.isCommand !== undefined;
    const guild = isInteraction ? context.guild : context.guild;

    const botVoiceState = guild.members.me.voice;

    if (!botVoiceState || !botVoiceState.channel) {
        const response = '¿Me vas a sacar en donde no estoy? Tú eres como rarito.';
        if (isInteraction) {
            await (context.deferred || context.replied ? context.editReply(response) : context.reply(response));
        } else {
            context.reply(response);
        }
        return;
    }

    const connection = getVoiceConnection(guild.id);
    if (connection) {
        connection.destroy();

        const response = 'Nospi, cachones.';

        if (isInteraction) {
            if (context.deferred || context.replied) {
                const textChannel = context.channel;
                textChannel?.send(response);
            } else {
                await context.reply(response);
            }
        } else {
            context.reply(response);
        }
    } else {
        const response = '¿¿Qué mondá haces??';
        if (isInteraction) {
            await (context.deferred || context.replied ? context.editReply(response) : context.reply(response));
        } else {
            context.reply(response);
        }
    }
}

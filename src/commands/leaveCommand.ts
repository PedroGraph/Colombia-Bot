import { getVoiceConnection } from '@discordjs/voice';

export async function leaveVoiceChannel(context: any, activeConnections?: Map<string, any>) {
    // Determina si es un mensaje o una interacción
    const isInteraction = context.isCommand !== undefined;
    const guild = isInteraction ? context.guild : context.guild;

    if (!guild) {
        console.error('No se pudo obtener el servidor');
        return;
    }

    const botVoiceState = guild.members.me?.voice;

    if (!botVoiceState || !botVoiceState.channel) {
        const response = '¿Me vas a sacar en donde no estoy? Tú eres como rarito.';
        if (isInteraction) {
            await (context.deferred || context.replied ? context.editReply(response) : context.reply(response));
        } else {
            await context.reply(response);
        }
        return;
    }

    const connection = getVoiceConnection(guild.id);
    if (connection) {
        connection.destroy();

        if (activeConnections) {
            activeConnections.delete(guild.id);
        }

        const response = 'Nospi, cachones.';

        if (isInteraction) {
            if (context.deferred || context.replied) {
                const textChannel = context.channel;
                await textChannel?.send(response);
            } else {
                await context.reply(response);
            }
        } else {
            await context.reply(response);
        }
    } else {
        const response = '¿¿Qué mondá haces??';
        if (isInteraction) {
            await (context.deferred || context.replied ? context.editReply(response) : context.reply(response));
        } else {
            await context.reply(response);
        }
    }
}
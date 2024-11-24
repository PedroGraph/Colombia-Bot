import { Routes} from 'discord.js';

export async function deleteAllGlobalCommands({ CLIENT_ID, rest }) {
    try {
        console.log('Eliminando todos los comandos globales...');
        const commands = await rest.get(Routes.applicationCommands(CLIENT_ID));
        for (const command of commands) {
            await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
            console.log(`Comando global ${command.name} eliminado.`);
        }
    } catch (error) {
        console.error(`Error al eliminar los comandos globales: ${error}`);
    }
}
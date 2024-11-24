import { deleteAllGlobalCommands } from './utils/globalCommands.js';
import { commands } from './utils/config.js';
import { handlePlayCommand } from './commands/playCommand.js';
import { leaveVoiceChannel } from './commands/leaveCommand.js';
import { checkVoiceChannelActivity } from './utils/activityChannel.js';
import { AUDIO_PATHS, AUDIO_PATHS_INTERACTION} from './utils/config.js';


export const discordReady = ({client, CLIENT_ID, rest, Routes}) =>{
    client.once('ready', async () => {
        console.log(`Bot conectado como ${client.user.tag}`);
        const guilds = client.guilds.cache.map(guild => guild.id);
        try {
            await deleteAllGlobalCommands({ CLIENT_ID, rest });
            console.log('Registrando comandos slash...');
            guilds.forEach(guildId => rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands }));
            console.log('Comandos slash registrados correctamente.');
        } catch (error) {
            console.error('Error al registrar comandos slash:', error);
        }
    });
}

export const discordMessages = ({client, activeConnections}) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const command = message.content.toLowerCase();
    
        if (command === '!salir') leaveVoiceChannel(message, activeConnections);
    
        const connection = await handlePlayCommand(message);
    
        if (connection) {
            const voiceChannel = message.member.voice.channel;
            activeConnections.set(message.guild.id, connection);
            const intervalId = setInterval(() => {
                const currentConnection = activeConnections.get(message.guild.id);
                if (!currentConnection) {
                    clearInterval(intervalId);
                    return;
                }
                checkVoiceChannelActivity(connection, activeConnections, message, voiceChannel);
            }, 60000);
        }
    });
}


export const discordInteractions = ({client, activeConnections}) => {
    client.on('interactionCreate', async (interaction) => {

        if(interaction.isAutocomplete()) {
            const focusedValue = interaction.options.getFocused();
            const inters = AUDIO_PATHS_INTERACTION[interaction.commandName];
            const filtered = inters.filter(action =>  action.name.toLowerCase().includes(focusedValue.toLowerCase()));
            await interaction.respond(filtered.map(action => ({ name: action.name, value: action.value })));
        }
        
    
        if (!interaction.isCommand()) return;
        const { commandName, options } = interaction;
        await interaction.deferReply(); // Diferir la respuesta
    
        const commandInput = options.getString(commandName.toLowerCase() === 'radio' ? 'radio' : 'fornicamos');
        await interaction.editReply(`Reproduciendo: ${AUDIO_PATHS[commandInput.toLowerCase()].message}`); // Editar la respuesta
    
        const message = interaction;
        const voiceChannel = message.member.voice.channel;
        message.content = `${commandInput.toLowerCase()}`;  // Modificar el contenido del mensaje
        const connection = await handlePlayCommand(message); // Llamar a la función para manejar la reproducción
    
        if (!connection) console.error("No se pudo conectar al canal de voz.");

        activeConnections.set(interaction.guildId, connection); // Guardar la conexión activa
        const intervalId = setInterval(() => {
            const currentConnection = activeConnections.get(message.guild.id);
            if (!currentConnection) {
                clearInterval(intervalId);
                return;
            }
            checkVoiceChannelActivity(connection, activeConnections, message, voiceChannel);
        }, 60000);
    
        
    });
}
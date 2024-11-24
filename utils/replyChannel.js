export const botReply = async (message, content) => {
    const isInteraction = !!message.isCommand;
    if (isInteraction) return await (message.replied || message.deferred ? message.editReply(content) : message.reply(content));
    return await message.reply(content);
};

export const botReply = async (message: any, content: any) => {
    const isInteraction = !!message.isCommand;
    if (isInteraction) return await (message.replied || message.deferred ? message.editReply(content) : message.reply(content));
    return await message.reply(content);
};

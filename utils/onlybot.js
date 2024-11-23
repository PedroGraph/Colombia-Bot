export function checkIfOnlyBot(voiceChannel) {
    if (!voiceChannel) return false; 
    const members = voiceChannel.members; 
    const botMember = members.find((member) => member.user.bot); 
    return members?.size < 2 && botMember?.user?.bot;
}

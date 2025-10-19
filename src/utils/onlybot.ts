export function checkIfOnlyBot(voiceChannel: any) {
    if (!voiceChannel) return false; 
    const members = voiceChannel.members; 
    const botMember = members.find((member: any) => member.user.bot); 
    return members?.size < 2 && botMember?.user?.bot;
}

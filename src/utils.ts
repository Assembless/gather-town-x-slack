import config from "./config";
import { GatherPlayer, Member } from "./types";

/**
 * @param player 
 * @param isOffline 
 * @returns Formatted player label for the presence message.
 */
const createPlayerLabel = (player: GatherPlayer, isOffline: boolean = false) => {
    const name = player?.slackId ? `<@${player.slackId}>` : player.name;
    
    const label = `*${name}*`;
    const status_emoji = isOffline ? "🔌" : player.emojiStatus;
    const status_text = isOffline ? "Offline" : player.textStatus;

    if(status_emoji || status_text)
        return `${label} \`${status_emoji} ${status_text}\``;
    else
        return label;
}

/**
 * Generates the presence message based on Gather activity.
 * @param players 
 * @returns Presence message generated for Slack (using MD).
 */
export const generatePresenceMessage = (players: GatherPlayer[]) => {
    const members = config.members;

    let message = [];
    message.push(`:office: Metaverse Office`);
    message.push(`There are *${players.length}* people in the office.`);
    message.push(`\n`);
    message.push(`\n`);

    // Creates a presence list for online and offline members.
    if(members.length > 0) {
        const membersOnline = players
                                .filter(filterMembers(members, true));

        const membersOffline = members
                                .filter(filterOfflineMembers(membersOnline));

        message.push(`🧑‍🚀  *Members (${membersOnline.length} online)*`);

        if(membersOnline.length > 0)
            message.push(generateBulletList(membersOnline.map((player) => createPlayerLabel(player))));

        message.push(`\n`);

        // @ts-ignore
        message.push(generateBulletList(membersOffline.map((player) => createPlayerLabel(player, true))));

        message.push(`\n`);
        message.push(`\n`);
    }

    // Creates a presence list for online guests.
    if(players.length > 0) {
        const guestsOnline = players
                                .filter(filterMembers(members, false))
                                .map((player) => createPlayerLabel(player));

        if(guestsOnline.length > 0) {
            message.push(`👋  *Guests (${guestsOnline.length} online)*`);
            message.push(`\n`);
            message.push(generateBulletList(guestsOnline));
        }
    }

    return message.join("\n");
}

/**
 * Filter players by member list.
 * @param members 
 * @param included
 */
const filterMembers =   (members: Member[], included: boolean = true) => 
                            (player: GatherPlayer) => 
                                !!members.find(member => player.gatherId === member.gatherId) === included;

/**
 * Generates a string bullet list suitable for markdown.
 */
export const generateBulletList = (items: string[]) => {
    return "- " + items.join("\n- ");
}

/**
 * Filter offline members.
 * @param membersOnline 
 * @returns 
 */
const filterOfflineMembers =    (membersOnline: GatherPlayer[]) => 
                                    (member: Member) => 
                                        !!membersOnline.find(memberOnline => memberOnline.gatherId !== member.gatherId);


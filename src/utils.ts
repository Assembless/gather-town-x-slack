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

    let message: string[] = [];
    const newLine = () => message.push(` `);
    const writeLine = (value: string) => message.push(value);

    // Write the header.
    writeLine(`:office: Metaverse Office`);
    writeLine(`There are *${players.length}* people in the office.`);
    newLine();
    newLine();

    // Creates a presence list for online and offline members.
    if(members.length > 0) {
        const membersOnline = players
                                .filter(filterMembers(members, true));

        const membersOffline = members
                                .filter(filterOfflineMembers(membersOnline));

        writeLine(`🧑‍🚀  *Members (${membersOnline.length} online)*`);

        if(membersOnline.length > 0)
            writeLine(generateBulletList(membersOnline.map((player) => createPlayerLabel(player))));

        newLine();

        // @ts-ignore
        writeLine(generateBulletList(membersOffline.map((player) => createPlayerLabel(player, true))));

        newLine();
        newLine();
    }

    // Creates a presence list for online guests.
    if(players.length > 0) {
        const guestsOnline = players
                                .filter(filterMembers(members, false))
                                .map((player) => createPlayerLabel(player));

        if(guestsOnline.length > 0) {
            writeLine(`👋  *Guests (${guestsOnline.length} online)*`);
            newLine();
            writeLine(generateBulletList(guestsOnline));
        }
    }

    newLine();
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
                                        !membersOnline.find(memberOnline => memberOnline.gatherId === member.gatherId);


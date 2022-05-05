import moment = require("moment");
import config from "./config";
import { GatherPlayer } from "./types";
import { filterMembers, filterOfflineMembers, generateBulletList } from "./utils";

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
    if (members.length > 0) {
        const membersOnline = players
            .filter(filterMembers(members, true));

        const membersOffline = members
            .filter(filterOfflineMembers(membersOnline));

        writeLine(`🧑‍🚀  *Members (${membersOnline.length} online)*`);

        if (membersOnline.length > 0) {
            newLine();
            writeLine(generateBulletList(membersOnline.map((player) => createPlayerLabel(player))));
            newLine();
        }

        newLine();

        // @ts-ignore
        writeLine(generateBulletList(membersOffline.map((player) => createPlayerLabel(player, true))));

        newLine();
        newLine();
    }

    // Creates a presence list for online guests.
    if (players.length > 0) {
        const guestsOnline = players
            .filter(filterMembers(members, false))
            .map((player) => createPlayerLabel(player));

        if (guestsOnline.length > 0) {
            writeLine(`👋  *Guests (${guestsOnline.length} online)*`);
            newLine();
            writeLine(generateBulletList(guestsOnline));
        }
    }
    
    newLine();
    newLine();
    newLine();
    writeLine(" ");
    return message.join("\n");
};

/**
 * @param player
 * @param isOffline
 * @returns Formatted player label for the presence message.
 */
const createPlayerLabel = (player: GatherPlayer, isOffline: boolean = false) => {
    const isAFK = moment(player.lastActive).isBefore(moment().subtract(5, "minutes"));

    const name = player?.slackId ? `<@${player.slackId}>` : player.name;

    const last_seen_text = player.lastSeen ? ` (last seen: ${moment(player?.lastSeen).fromNow()})` : ""

    const label = `*${name}*`;
    const status_emoji = isOffline ? "🔌" : isAFK ?  " 💤 " : player.emojiStatus;
    const status_text = isOffline ? `Offline${last_seen_text}` : isAFK ? `AFK` : player.textStatus;

    if (status_emoji || status_text)
        return `${label} \`${status_emoji} ${status_text}\``;

    else
        return label;
};

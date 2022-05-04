import config from "./config";
import { GatherPlayer, Member } from "./types";

/**
 * @description Check's whether the given player is a member of the office.
 * @param gatherId 
 */
export const isMember = (gatherId: string) => config.members.find(member => member.gatherId === gatherId);

/**
 * Filter players by member list.
 * @param members 
 * @param included
 */
export const filterMembers =   (members: Member[], included: boolean = true) => 
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
export const filterOfflineMembers =    (membersOnline: GatherPlayer[]) => 
                                    (member: Member) => 
                                        !membersOnline.find(memberOnline => memberOnline.gatherId === member.gatherId);


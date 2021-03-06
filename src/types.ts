import { Player } from "@gathertown/gather-game-client";

export interface GatherPlayer extends Player {
    slackId: string;
    gatherId: string;
    lastSeen?: Date;
}

export interface Member {
    name: string;
    slackId: GatherPlayer['slackId'];
    gatherId: GatherPlayer['gatherId'];
    lastSeen?: Date;
}
import { Game } from "@gathertown/gather-game-client";
import config from "./config";

const API_KEY = config.gather.apiKey;
const SPACE_ID = config.gather.spaceId;
const MAP_ID = config.gather.mapId;

export const initGather = async () => {
    // create the game object, giving it your API key in this weird way
    // @ts-ignore
    const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }));
    // this is the line that actually connects to the server and starts initializing stuff
    await game.connect();
    console.log(`⚡️ Gather is connected!`);

    return game;
}
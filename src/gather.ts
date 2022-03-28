import { Game } from "@gathertown/gather-game-client";
import * as dotenv from 'dotenv';

dotenv.config()

const API_KEY = process.env.GATHER_API_KEY;
const SPACE_ID = process.env.GATHER_SPACE_ID;
// const MAP_ID = process.env.GATHER_MAP_ID

const MIKE_PLAYER_ID = "1kZCHNAWcsZXqG1pZ9OzgFwX7jz2";

export const initGather = async () => {
    // create the game object, giving it your API key in this weird way
    // @ts-ignore
    const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }), console.log);
    // this is the line that actually connects to the server and starts initializing stuff
    await game.connect();
    // optional but helpful callback to track when the connection status changes
    // game.subscribeToConnection((connected) => console.log("connected?", connected));

    // game.subscribeToEvent('playerMoves', (v, x) => console.log(JSON.stringify(v, null, 2), JSON.stringify(x, null, 2)));
    // game.teleport(MAP_ID, 24, 14, "1kZCHNAWcsZXqG1pZ9OzgFwX7jz2")
    // game.fxShakeCamera(MAP_ID, MIKE_PLAYER_ID, 10, 2000)

    return game;
}
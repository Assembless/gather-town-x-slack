import { Game } from "@gathertown/gather-game-client";

const API_KEY = "MQiaWBC2CYrRmUXW";
const SPACE_ID = "c0ajLLNc3ph92hRG/Assembless";
const MAP_ID = "rw-6"

const MIKE_PLAYER_ID = "1kZCHNAWcsZXqG1pZ9OzgFwX7jz2";

const main = async () => {
    // create the game object, giving it your API key in this weird way
    const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }), console.log);
    // this is the line that actually connects to the server and starts initializing stuff
    await game.connect();
    // optional but helpful callback to track when the connection status changes
    // game.subscribeToConnection((connected) => console.log("connected?", connected));

    // game.subscribeToEvent('playerMoves', (v, x) => console.log(JSON.stringify(v, null, 2), JSON.stringify(x, null, 2)));
    // game.teleport(MAP_ID, 24, 14, "1kZCHNAWcsZXqG1pZ9OzgFwX7jz2")
    // game.fxShakeCamera(MAP_ID, MIKE_PLAYER_ID, 10, 2000)
}

main();
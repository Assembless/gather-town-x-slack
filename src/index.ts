import { Game } from "@gathertown/gather-game-client";

const API_KEY = "LBTb6gfXQq0xUA8K"; //a2ecc1a2d715406756ca6fc9d1354b4cc10cef70cea761011e907ce4dfdcb366
const SPACE_ID = "c0ajLLNc3ph92hRG";

const main = async () => {
    // create the game object, giving it your API key in this weird way
    const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }));
    // this is the line that actually connects to the server and starts initializing stuff
    await game.connect();
    // optional but helpful callback to track when the connection status changes
    // game.subscribeToConnection((connected) => console.log("connected?", connected));
}

main();
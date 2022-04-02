import { App } from "@slack/bolt";
import config from "./config";

const app = new App(config.slack.appOptions);
const port = config.slack.port;

/**
 * Initializes the Slack app.
 */
export const initSlack = async () => {
    await app.start(port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);

    return app;
}

/**
 * Removes all messages from a specified Slack channel.
 * @param channelId 
 */
export const deleteAllMessages = async (channelId: string) => {
    // Get the conversations history.
    const history = await app.client.conversations.history({
      channel: channelId,
    });

    // Remove each message from the channel.
    (history?.messages ?? []).forEach((message) => {
      app.client.chat.delete({ channel: channelId, ts: message.ts! });
    });
  };
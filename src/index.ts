import { initGather } from "./gather";
import { Emoji } from "./emoji";
import config from "./config";
import { deleteAllMessages, initSlack } from "./slack";
import { generatePresenceMessage } from "./utils";
import { GatherPlayer } from "./types";

const PRESENCE_CHANNEL_ID = config.slack.presenceChannelId!;
const CHAT_CHANNEL_ID = config.slack.chatChannelId!;

/**
 * It's here... where it all begins :D
 */
(async () => {
  const slackClient = await initSlack();
  const gatherClient = await initGather();

  /**
   * The players currently online in Gather space.
   */
  const playersOnline: GatherPlayer[] = [];

  /**
   * ID of the message used to update the presence on Slack.
   */
  let messageId = "";

  /**
   * Updates the presence message on Slack.
   */
  const updateOnlinePresenceMessage = async () => {
    const generatedMessage = generatePresenceMessage(playersOnline);

    try {
      // Try updating the message with new presence.
      if (!messageId) {
        // Try finding the first message in history. 
        const history = await slackClient.client.conversations.history({
          channel: PRESENCE_CHANNEL_ID,
        });

        // Find the first message in history.
        const msgId = history?.messages?.find((x) => x.ts)?.ts;

        if (msgId) {
          // Save the message ID.
          messageId = msgId;
        } else {
          throw new Error("No message found");
        }
      }

      // Update the presence message.
      await slackClient.client.chat
              .update({
                channel: PRESENCE_CHANNEL_ID,
                ts: messageId,
                text: generatedMessage,
                link_names: true,
              });

    } catch (err) {
      // Remove all messages from the channel.
      await deleteAllMessages(PRESENCE_CHANNEL_ID);
      
      // Post a new message and save it to make use of it in the future.
      const newMessage = await slackClient.client.chat
              .postMessage({
                channel: PRESENCE_CHANNEL_ID,
                mrkdwn: true,
                text: generatedMessage,
                link_names: true,
                attachments: [
                  {
                    text: "Want to visit the office?",
                    callback_id: "visit_office",
                    actions: [
                      {
                        text: "Visit Office",
                        type: "button",
                        url: "https://office.assembless.tech", // Change this url to your own.
                      },
                    ],
                  },
                ],
              });

      // Save the message ID.
      messageId = newMessage.ts!;
    }
  };

  /**
   * Gather event handler for player joining.
   */
  gatherClient.subscribeToEvent("playerJoins", async (data, context) => {
    const exists =
      playersOnline.map((p) => p.gatherId).indexOf(context.playerId!) !== -1;

    if (!exists) {
      // Get the full player object from gather.
      const gatherPlayer = gatherClient.getPlayer(context.playerId!);
      // Find the player's slack id. Only available for members.
      const member = config.members.find(
        (member) => member.gatherId === context.playerId
      );

      if (gatherPlayer !== null) {
        // @ts-ignore
        playersOnline.push({
          ...context.player,
          ...gatherPlayer,
          gatherId: context.playerId!,
          slackId: member?.slackId!,
        });

        updateOnlinePresenceMessage();
      }
    }
  });

  /**
   * Gather event handler for player leaving.
   */
  gatherClient.subscribeToEvent("playerExits", (data, context) => {
    const playerIndex = playersOnline
      .map((p) => p.gatherId)
      .indexOf(context.playerId!);

    if (playerIndex > -1) {
      // Remove the player from the list.
      playersOnline.splice(playerIndex, 1);

      updateOnlinePresenceMessage();
    }
  });

  /**
   * Send messages from Gather to Slack.
   * ! Not working correctly yet!
   */
  // gatherClient.subscribeToEvent("playerChats", async (data, context) => {
  //   if(data.playerChats.contents.indexOf("[SLACK]") === -1)
  //     await slackClient.client.chat.postMessage({
  //         channel: CHAT_CHANNEL_ID,
  //         text: `*${context?.player?.name}* said: \n> ${data.playerChats.contents}`,
  //         mrkdwn: true,
  //     });
  // });

  /**
   * Send messages from Slack to Gather.
   * ! Not working correctly yet!
   */
  // slackClient.message(async ({ message, context }) => {
  //   // @ts-ignore
  //   if(message.channel === CHAT_CHANNEL_ID && message.text) {
  //     // @ts-ignore
  //     gatherClient.chat('GLOBAL_CHAT', [], "rw-6", { contents: (players.find(p => p.id === context.playerId)?.name ?? "Anonymous") + " said: " + message.text + " [SLACK]" });
  //   }
  // });

  /**
   * Slack event handler for user change. It's used to sync user status between Slack and Gather.
   */
  slackClient.event("user_change", async ({ event }) => {
    const member = config.members.find(
      (member) => member.slackId === event.user.id
    );

    if (!!member) {
      const status_emoji = event.user.profile.status_emoji;
      // @ts-ignore
      const status_emoji_icon = Emoji[status_emoji.replace(/:/g, "")];
      const status_text = event.user.profile.status_text;

      gatherClient.setTextStatus(status_text, member.gatherId);
      gatherClient.setEmojiStatus(status_emoji_icon ?? status_emoji, member.gatherId);
    }
  });

  /**
   * Slack command that shakes every player's camera in Gather.
   */
  slackClient.command("/shakeit", async ({ ack }) => {
    await ack();

    playersOnline.forEach((player) => {
      gatherClient.fxShakeCamera("rw-6", player.gatherId, 8, 1500);
    });
  });

  /**
   * Main interval loop syncing player data.
   */
  setInterval(() => {
    // Refetch all Gather players data.
    playersOnline.forEach(async (player) => {
      const gatherPlayer = gatherClient.getPlayer(player.gatherId);

      playersOnline[playersOnline.indexOf(player)] = { ...player, ...gatherPlayer };
    });
    console.log(`[${new Date()}]`, "Gather players synced.");

    updateOnlinePresenceMessage();
  }, 30000);
})();

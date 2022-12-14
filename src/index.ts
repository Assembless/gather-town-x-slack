import { initGather } from "./gather";
import { Emoji } from "./emoji";
import config from "./config";
import { deleteAllMessages, initSlack } from "./slack";
import { generatePresenceMessage } from "./presence";
import { GatherPlayer } from "./types";
import * as http from 'http';

const PRESENCE_CHANNEL_ID = config.slack.presenceChannelId!;
const CHAT_CHANNEL_ID = config.slack.chatChannelId!;

// Used for health check.
const healthServerListener = () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("healthy");
  });
  server.listen(8080);
}

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
                  url: "https://app.gather.town/app/" + config.gather.spaceId, // Change this url to your own.
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
      // ! The "getPlayer" method's ReturnType should be a Promise!
      const gatherPlayer = await gatherClient.getPlayer(context.playerId!);
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

        slackClient.client.chat.postMessage({
          channel: config.slack.logsChannelId as string, 
          text: `🚪 *${context.player?.name ?? "Someone"}* joined the space.`,
          mrkdwn: true
        })
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

      const memberIds = config.members.map((m) => m.gatherId);
      const memberIndex = memberIds.indexOf(context.playerId!);
      config.members[memberIndex].lastSeen = new Date();

      updateOnlinePresenceMessage();

      slackClient.client.chat.postMessage({
        channel: config.slack.logsChannelId as string, 
        text: `🚪 *${context.player?.name ?? "Someone"}* left the space.`,
        mrkdwn: true
      })
    }
  });
  
  // ! Doorbell and chat features only available if the chat channel id has been provided.
  if (!!CHAT_CHANNEL_ID) {

    /**
     * Gather event handler for player with objects interactions.
     */
    gatherClient.subscribeToEvent("playerInteracts", async (data, context) => {
      // Send a notification to the Slack chat channel when someone interacts with the specified doorbell object.
      if (data.playerInteracts.objId === config.gather.doorBellId) {
        slackClient.client.chat.postMessage({
          channel: CHAT_CHANNEL_ID,
          text: `🔔 Hey! *${context.player?.name ?? "Someone"}* rang the doorbell!`,
          mrkdwn: true
        })
      }
    });

    /**
     * Send messages from Gather to Slack.
     */
    gatherClient.subscribeToEvent("playerChats", async (data, context) => {
      if (data.playerChats.messageType === "DM") return;

      // if(data.playerChats.senderId !== config.gather.botId)
      //   await slackClient.client.chat.postMessage({
      //       channel: CHAT_CHANNEL_ID,
      //       text: `*${context?.player?.name}* said: \n> ${data.playerChats.contents}`,
      //       mrkdwn: true,
      //   });
    });

    /**
     * Send messages from Slack to Gather.
     */
    slackClient.message(async ({ message, context }) => {
      // @ts-ignore
      if (message.channel === CHAT_CHANNEL_ID && message.text) {
        // @ts-ignore
        const playerName = playersOnline.find(p => p.slackId === context.playerId)?.name ?? "Anonymous";

        gatherClient.chat(
          'GLOBAL_CHAT',
          [],
          "rw-6",
          {
            // @ts-ignore
            contents: (playerName + " said: " + message.text)
          });
      }
    });
  }


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
   * Slack command that returns the current online players in Gather.
   * Mainly used to get the list of player id's to use with the members list.
   */
  slackClient.command("/gatherplayers", async ({ ack, say }) => {
    await ack();

    let message: string[] = [];

    playersOnline.forEach((player, index) => {
      message.push(`${index + 1}. *${player.name}* ( ${player.gatherId} )`);
      message.push("Full player info (in JSON format):")
      message.push("```" + JSON.stringify(player, null, 2) + "```");
    })

    say(message.join("\n\n\n"));
  });

  /**
   * Main interval loop syncing player data.
   */
  setInterval(() => {
    // Refetch all Gather players data.
    playersOnline.forEach(async (player) => {
      const gatherPlayer = await gatherClient.getPlayer(player.gatherId);

      playersOnline[playersOnline.indexOf(player)] = { ...player, ...gatherPlayer };
    });

    console.log(`[${new Date()}]`, "Gather players synced.");

    updateOnlinePresenceMessage();
  }, 30000);

  healthServerListener();
})();
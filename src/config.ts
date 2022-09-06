import { Member } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * *Astronauts*
 * 
 * The members of Assembless.
 */
const MEMBERS: Member[] = [
  {
    name: "Mike",
    slackId: "U0366MZ8A1H",
    gatherId: "1kZCHNAWcsZXqG1pZ9OzgFwX7jz2",
  },
  {
    name: "Rafał",
    slackId: "U03692K5CSG",
    gatherId: "CwzQmehbWCfiHpeaHg0bhUY91Mz1",
  },
  {
    name: "Bartek",
    slackId: "U036034UZ62",
    gatherId: "zAbFaneypZOpmxkeNoF6eCyG6is1",
  },
  {
    name: "Krzysztof",
    slackId: "U036SB5JYHZ",
    gatherId: "H4wSnVqIjUYk7EQoY0IDFMEjSXY2",
  },
  {
    name: "Karolina",
    slackId: "U0360356C3Y",
    gatherId: "",
  },
  {
    name: "Ekikere-abasi Michael",
    slackId: "U03N889K134",
    gatherId: "6n9vDhhOenU90W3ZulnvOaZX3Nf1",
  },
  {
    name: "David",
    slackId: "U03V0TC3DGE",
    gatherId: "uLYzZBPu18eoeQUaZItkU0YcAh73",
  },
  {
    name: "Łukasz",
    slackId: "U040B1QF4PR",
    gatherId: "UqG12OCQhEYSR37Fa0zXz9x8SUF2",
  }
];

const {
  GATHER_MAP_ID,
  GATHER_SPACE_ID,
  GATHER_API_KEY,
  GATHER_BOT_ID,
  SLACK_APP_TOKEN,
  SLACK_SIGNING_SECRET,
  SLACK_BOT_TOKEN,
  SLACK_PORT,
  SLACK_CHAT_CHANNEL_ID,
  SLACK_PRESENCE_CHANNEL_ID,
  GATHER_DOORBELL_OBJ_ID
} = process.env;

export default {
  members: MEMBERS,
  slack: {
    presenceChannelId: SLACK_PRESENCE_CHANNEL_ID,
    chatChannelId: SLACK_CHAT_CHANNEL_ID,
    port: SLACK_PORT ?? 3000,
    appOptions: {
      token: SLACK_BOT_TOKEN,
      signingSecret: SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: SLACK_APP_TOKEN,
    },
  },
  gather: {
    apiKey: GATHER_API_KEY,
    spaceId: GATHER_SPACE_ID,
    mapId: GATHER_MAP_ID,
    botId: GATHER_BOT_ID,
    doorBellId: GATHER_DOORBELL_OBJ_ID,
  },
};

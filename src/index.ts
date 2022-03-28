import * as dotenv from 'dotenv';
import { App } from '@slack/bolt';
import { initGather } from './gather';

dotenv.config()

console.log(process.env.SLACK_BOT_TOKEN);

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  });

(async () => {
    const port = 3000
    // Start your app
    await app.start(process.env.PORT || port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);

    const game = await initGather();

    game.subscribeToEvent('playerChats', console.log)

    app.client.chat.postMessage({ channel: 'office', text: 'Hello world!' });
  })();

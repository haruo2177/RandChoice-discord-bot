import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { logger } from "hono/logger";
import { getServerUsers as getGuildMembers, listChannelUserIds as getVoiceChannelUserIds } from "./utils";

const app = new Hono();

app.use(logger());

app.use("/interactions", async (c, next) => {
  const { DISCORD_PUBLIC_KEY } = env<{ DISCORD_PUBLIC_KEY: string }>(c);
  if (!DISCORD_PUBLIC_KEY) {
    return c.json({ message: "DISCORD_PUBLIC_KEY is not set" }, 500);
  }

  const signature = c.req.header("X-Signature-Ed25519");
  const timestamp = c.req.header("X-Signature-Timestamp");
  if (!signature || !timestamp) {
    return c.json({ message: "invalid request signature" }, 401);
  }

  const rawBody = await c.req.raw.clone().text();
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    return c.json({ message: "invalid request signature" }, 401);
  }

  const body = JSON.parse(rawBody);
  if (body.type === InteractionResponseType.PONG) {
    return c.json({ type: InteractionResponseType.PONG });
  }
  await next();
});

app.post("/interactions", async (c) => {
  const { DISCORD_BOT_TOKEN } = env<{ DISCORD_BOT_TOKEN: string }>(c);
  if (!DISCORD_BOT_TOKEN) {
    return c.json({ message: "DISCORD_BOT_TOKEN is not set" }, 500);
  }

  // サーバー、チャンネル情報を取得
  const { type, channel } = await c.req.json();
  console.log({ channel });

  if (type === InteractionType.APPLICATION_COMMAND) {
    // サーバーのユーザー情報を取得
    const members = await getGuildMembers(channel.guild_id, DISCORD_BOT_TOKEN);
    console.log({ members });

    // bot 以外のユーザIDを取得
    const userIds = members.map((member) => member.user.id);
    console.log({ userIds });

    // コマンドが実行されたチャンネルに入室しているユーザIDのみ抽出
    const voiceChannelUserIds = getVoiceChannelUserIds(channel.id, userIds, DISCORD_BOT_TOKEN, channel.id);
    console.log({ voiceChannelUserIds });

    // チャンネルに入室しているユーザ名を取得
    const userNames = members
      .filter((member) => voiceChannelUserIds.includes(member.user.id))
      .map((member) => member.user.global_name ?? member.user.username);
    console.log({ userNames });

    // ランダムにユーザを一人だけ抽出
    const randomUserName = userNames[Math.floor(Math.random() * userNames.length)];
    console.log({ randomUserName });

    return c.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: randomUserName },
    });
  }
});

export default app;

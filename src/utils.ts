import type { APIGuildMember, APIVoiceState } from "discord-api-types/v10";

export const getServerUsers = async (guildId: string, botToken: string) => {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=100`, {
      method: "GET",
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guild members: ${response.statusText}`);
    }

    const members = (await response.json()) as APIGuildMember[];
    return members;
  } catch (error) {
    console.error("Error fetching guild members:", error);
    return [];
  }
};

export const listChannelUserIds = (guildId: string, userIds: string[], botToken: string, channelId: string) => {
  const channelUserIds = userIds.filter(async (userId) => {
    try {
      const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/voice-states/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bot ${botToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch guild members: ${response.statusText}`);
      }

      const voiceState = (await response.json()) as APIVoiceState;
      return voiceState.channel_id === channelId;
    } catch (error) {
      console.error("Error fetching users voice state:", error);
      return false;
    }
  });
  return channelUserIds;
};

import discord from "discord.js";

export async function fetchUser<T>(client: discord.Client, userID: string, def: T): Promise<discord.User | T> {
  try {
    return await client.users.fetch(userID);
  } catch {
    return def;
  }
}

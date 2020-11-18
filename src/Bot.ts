import discord from "discord.js";
import DatabaseConnector from "./data/Database";
import dotenv from "dotenv-safe";

dotenv.config();

export default class Bot {
  private static isInitialized = false;
  public static init(): void {
    if (!this.isInitialized) void new Bot().start();
    this.isInitialized = true;
  }

  client: discord.Client;
  database: DatabaseConnector;

  private constructor() {
    this.client = new discord.Client({
      ws: {
        intents: ["GUILDS", "GUILD_MESSAGES"],
      },
      disableMentions: "everyone",
      shards: "auto",
    });
    this.database = new DatabaseConnector({
      host: process.env.MARIADB_HOST!,
      port: Number.parseInt(process.env.MARIADB_PORT!),
      username: process.env.MARIADB_USER!,
      password: process.env.MARIADB_PASSWORD!,
      database: process.env.MARIADB_DATABASE!,
    });
  }

  async start(): Promise<void> {
    await this.client.login(process.env.DISCORD_TOKEN);
  }
}

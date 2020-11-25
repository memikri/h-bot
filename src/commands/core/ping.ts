import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
import Bot from "../../Bot";
import SQL from "sql-template-strings";

export default class PingCommand implements ICommand {
  name = "ping";
  aliases = [];
  description = "Pong!";
  permission = PermissionLevel.EVERYONE;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message): Promise<void> {
    const msgSendBefore = Date.now();
    const m = await msg.channel.send("h!");
    const msgSendLatency = Date.now() - msgSendBefore;

    const dbReadBefore = Date.now();
    await this.bot.connector.selectOne(SQL`SELECT NOW()`);
    const dbReadLatency = Date.now() - dbReadBefore;

    const redisReadBefore = Date.now();
    await this.bot.redisConnection.ping();
    const redisReadLatency = Date.now() - redisReadBefore;

    await m.edit("h!", {
      embed: {
        description:
          "```json\n" +
          JSON.stringify(
            {
              API: msgSendLatency - this.bot.client.ws.ping,
              Websocket: this.bot.client.ws.ping,
              Database: dbReadLatency,
              Redis: redisReadLatency,
            },
            null,
            2,
          ) +
          "\n```",
        color: 0x87ceeb,
        timestamp: new Date(),
      },
    });
  }
}

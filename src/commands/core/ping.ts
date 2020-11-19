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
    await this.bot.database.selectOne(SQL`SELECT NOW()`);
    const dbReadLatency = Date.now() - dbReadBefore;

    await m.edit(`h!
Message send API latency: ${msgSendLatency - this.bot.client.ws.ping}ms
Websocket ping: ${this.bot.client.ws.ping}ms
Database latency: ${dbReadLatency}ms`);
  }
}

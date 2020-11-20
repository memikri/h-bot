import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
import Bot from "../../Bot";
import * as parser from "discord-command-parser";
import { inspect } from "util";

export default class DBCommand implements ICommand {
  name = "db";
  aliases = ["datalol"];
  description = "Interface with the database";
  permission = PermissionLevel.BOT_OWNER;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const conn = await this.bot.connector.getConnection();
    const result = await conn.query(parsed.body);
    conn.release();

    await msg.channel.send(inspect(Array.isArray(result) ? Array.from(result) : result), { code: "js", split: true });
  }
}

import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
import Bot from "../../Bot";
import SQL from "sql-template-strings";

export default class RegisterCommand implements ICommand {
  name = "register";
  aliases = ["reg"];
  description = "Register yourself in the economy system.";
  permission = PermissionLevel.EVERYONE;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message): Promise<void> {
    const success = await this.bot.database.transaction(async tx => {
      const existing = await tx.selectOne<{ 1: 1 }>(SQL`SELECT 1 FROM User WHERE snowflake = ${msg.author.id}`);
      if (existing) {
        return false;
      } else {
        await tx.insert(SQL`INSERT INTO User SET snowflake = ${msg.author.id}`);
        return true;
      }
    });
    if (success) {
      await msg.channel.send(":white_check_mark: You have been registered with the economy system, you may now use economy commands.");
    } else {
      await msg.channel.send(":x: You have already registered, and therefore cannot register again. Idiot.");
    }
  }
}

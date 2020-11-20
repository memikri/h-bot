import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
import Bot from "../../Bot";
import * as parser from "discord-command-parser";
import { fetchUser } from "../../lib/utils";

export class EcoSetCommand implements ICommand {
  name = "ecoset";
  aliases = ["eset"];
  description = "Set wallet and bank balance for users in the economy system.";
  permission = PermissionLevel.BOT_OWNER;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const target = await fetchUser(msg.client, parsed.reader.getUserID(), null);
    const loc = parsed.reader.getString();
    const amount = parsed.reader.getInt(false, n => n >= 0);

    if (!target) {
      await msg.channel.send(":x: Please specify a valid user.");
      return;
    }

    if (amount === null) {
      await msg.channel.send(":x: Please specify a valid integer amount >= 0.");
      return;
    }

    const balance = await this.bot.database.getUserBalance(target.id);

    if (loc === "bank") {
      balance.bank = amount;
    } else if (loc === "wallet") {
      balance.wallet = amount;
    } else {
      await msg.channel.send(":x: Please specify a valid location (`bank` or `wallet`).");
      return;
    }

    await this.bot.database.setUserBalance(target.id, balance);

    await msg.channel.send(
      `:white_check_mark: Updated balance of **${
        target.tag
      }** -- bank = ${balance.bank.toLocaleString()}, wallet = ${balance.wallet.toLocaleString()}`,
    );
  }
}

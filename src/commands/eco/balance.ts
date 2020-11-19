import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
import { SQL } from "sql-template-strings";
import Bot from "../../Bot";
import * as parser from "discord-command-parser";
import { fetchUser } from "../../lib/utils";

export default class BalanceCommand implements ICommand {
  name = "balance";
  aliases = ["bal"];
  description = "Get your balance!";
  permission = PermissionLevel.EVERYONE;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const target = await fetchUser(msg.client, parsed.reader.getUserID() || msg.author.id, msg.author);

    const balance = await this.bot.database.selectOne<{ balance_wallet: number; balance_bank: number }>(
      SQL`SELECT balance_wallet, balance_bank FROM User WHERE snowflake = ${msg.author.id}`,
    );

    if (!balance) {
      await msg.channel.send(`You must use \`${parsed.prefix}register\` before you can use economy commands.`);
      return;
    }

    await msg.channel.send({
      embed: {
        title: `Balance for ${target.tag}`,
        color: 0x60ff60,
        fields: [
          {
            name: "Wallet",
            value: balance.balance_wallet.toLocaleString(),
            inline: false,
          },
          {
            name: "Bank",
            value: balance.balance_bank.toLocaleString(),
            inline: false,
          },
        ],
        timestamp: new Date(),
      },
    });
  }
}

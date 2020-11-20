import { ICommand, PermissionLevel } from "../../lib/Command";
import discord from "discord.js";
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

    const balance = await this.bot.database.getUserBalance(target.id);

    await msg.channel.send({
      embed: {
        title: `Balance for ${target.tag}`,
        color: 0x60ff60,
        thumbnail: {
          url: msg.author.displayAvatarURL({ dynamic: true }),
        },
        fields: [
          {
            name: "Wallet",
            value: balance.wallet.toLocaleString(),
            inline: false,
          },
          {
            name: "Bank",
            value: balance.bank.toLocaleString(),
            inline: false,
          },
        ],
        timestamp: new Date(),
      },
    });
  }
}

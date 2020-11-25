import { ICommand, PermissionLevel } from "../../lib/Command";
import discord, { PermissionResolvable } from "discord.js";
import parser from "discord-command-parser";
import { fetchUser } from "../../lib/utils";
import Bot from "../../Bot";

export class BalanceCommand implements ICommand {
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
          url: target.displayAvatarURL({ dynamic: true }),
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

export class PayCommand implements ICommand {
  name = "pay";
  aliases = ["give", "transfer"];
  botPermission: discord.PermissionResolvable = [];
  permission = PermissionLevel.EVERYONE;
  description = "Pay a user";

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const target = await fetchUser(
      msg.client,
      parsed.reader.getUserID(false, u => u !== msg.author.id),
      null,
    );
    const amount = parsed.reader.getInt(false, n => n > 0);

    if (target === null || amount === null) {
      await msg.channel.send("Please specify a valid user to pay and a valid amount.");
      return;
    }

    if (await this.bot.database.transferUserBalance(msg.author.id, target.id, amount)) {
      await msg.channel.send(`:white_check_mark: Transferred ${amount.toLocaleString()}h to ${target.tag}!`);
    } else {
      await msg.channel.send(
        `:x: Could not transfer ${amount.toLocaleString()}h. You have ${(await this.bot.database.getUserBalance(msg.author.id)).wallet}h in your wallet.`,
      );
    }
  }
}

export class DepositCommand implements ICommand {
  name = "deposit";
  description = "Deposit money from your wallet into your bank";
  aliases = ["dep"];
  botPermission: PermissionResolvable = [];
  permission = PermissionLevel.EVERYONE;

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const amountInt = parsed.reader.getInt(true, v => v > 0);
    const amountStr = parsed.reader.getString(false, v => v.toLowerCase() === "all");

    if (amountInt === null && amountStr === null) {
      await msg.channel.send(":x: Please specify a valid amount to deposit (use `all` to deposit all your money).");
      return;
    }

    if (await this.bot.database.moveBankBalance(msg.author.id, amountInt ?? "deposit_all")) {
      await msg.channel.send(":white_check_mark: Transaction succeeded.");
    } else {
      await msg.channel.send(":x: Transaction failed.");
    }
  }
}

export class WithdrawCommand implements ICommand {
  name = "withdraw";
  description = "Withdraw money from your bank into your wallet";
  aliases = ["with"];
  botPermission: PermissionResolvable = [];
  permission = PermissionLevel.EVERYONE;

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void> {
    const amountInt = parsed.reader.getInt(true, v => v > 0);
    const amountStr = parsed.reader.getString(false, v => v.toLowerCase() === "all");

    if (amountInt === null && amountStr === null) {
      await msg.channel.send(":x: Please specify a valid amount to withdraw (use `all` to withdraw all your money).");
      return;
    }

    if (await this.bot.database.moveBankBalance(msg.author.id, (amountInt && -amountInt) ?? "withdraw_all")) {
      await msg.channel.send(":white_check_mark: Transaction succeeded.");
    } else {
      await msg.channel.send(":x: Transaction failed.");
    }
  }
}

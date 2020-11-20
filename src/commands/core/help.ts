import discord from "discord.js";
import Bot from "../../Bot";
import { ICommand, PermissionLevel, checkPermission } from "../../lib/Command";

export default class HelpCommand implements ICommand {
  name = "help";
  aliases = [];
  description = "Shows information and usage for commands.";
  permission = PermissionLevel.EVERYONE;
  botPermission: discord.PermissionResolvable = [];

  constructor(public bot: Bot) {}

  async run(msg: discord.Message, args: string[]): Promise<void> {
    let s = "";
    if (args[0]) {
      const topic = this.bot.commands.resolve(args[0]);
      if (topic) {
        s += `\`${topic.name}\`\n${topic.description}\n\nAliases: ${topic.aliases.join(", ") || "<None>"}`;
      } else {
        s += ":x: Could not find command.";
      }
    } else {
      for (const [name, cmd] of Object.entries(this.bot.commands.commands).sort((a, b) => a[0].localeCompare(b[0]))) {
        // TODO: permission check
        if (!checkPermission(this.bot, msg, cmd.permission)) continue;
        s += `\`${name}\` - ${cmd.description}\n`;
      }
    }
    await msg.channel.send({ embed: { color: 0x87ceeb, title: `${msg.client.user?.username} - Help`, description: s } });
  }
}

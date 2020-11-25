import discord from "discord.js";
import * as parser from "discord-command-parser";
import logger from "./Logger";
import Bot from "../Bot";

export const enum PermissionLevel {
  EVERYONE = 0,
  SERVER_MOD = 1,
  SERVER_ADMIN = 2,
  SERVER_OWNER = 3,
  BOT_OWNER = 4,
  NOBODY = 5,
}

export function checkPermission(bot: Bot, msg: discord.Message, permission: PermissionLevel): boolean {
  if (!msg.guild?.me) return false;
  if (msg.channel instanceof discord.DMChannel) return false;
  if (!msg.member) return false;

  switch (permission) {
    case PermissionLevel.EVERYONE:
      return true;
    case PermissionLevel.SERVER_MOD:
      return msg.member.hasPermission("KICK_MEMBERS") || checkPermission(bot, msg, PermissionLevel.SERVER_ADMIN);
    case PermissionLevel.SERVER_ADMIN:
      return msg.member.hasPermission("ADMINISTRATOR") || checkPermission(bot, msg, PermissionLevel.SERVER_OWNER);
    case PermissionLevel.SERVER_OWNER:
      return msg.member.id === msg.guild.ownerID || checkPermission(bot, msg, PermissionLevel.BOT_OWNER);
    case PermissionLevel.BOT_OWNER: {
      const appOwner = bot.application.owner;
      if (appOwner instanceof discord.Team) {
        return appOwner.members.some(member => member.id === msg.author.id);
      } else if (appOwner instanceof discord.User) {
        return appOwner.id === msg.author.id;
      } else {
        logger.warn("application is not Team or User.");
        return false;
      }
    }
    default:
      return false;
  }
}

export interface ICommand {
  name: string;
  aliases: string[];
  description: string;
  permission: PermissionLevel;
  botPermission: discord.PermissionResolvable;

  run(msg: discord.Message, args: string[], parsed: parser.SuccessfulParsedMessage<discord.Message>): Promise<void>;
}

export class CommandRegistry {
  commands: Record<string, ICommand> = {};
  aliases: Record<string, ICommand> = {};

  add(cmd: ICommand): this {
    if (cmd.name in this.commands) throw new Error(`Command ${cmd.name} already loaded`);
    this.commands[cmd.name] = cmd;
    for (let i = 0; i < cmd.aliases.length; i++) {
      if (cmd.aliases[i] in this.aliases)
        throw new Error(`Command ${cmd.name} with alias ${cmd.aliases[i]} already loaded under command ${this.aliases[cmd.aliases[i]].name}`);
      this.aliases[cmd.aliases[i]] = cmd;
    }
    return this;
  }

  resolve(cmd: string): ICommand | null {
    return this.commands[cmd] || this.aliases[cmd] || null;
  }

  remove(cmd: string): this {
    const res = this.resolve(cmd);
    if (res) {
      delete this.commands[res.name];
      for (let i = 0; i < res.aliases.length; i++) delete this.aliases[res.aliases[i]];
    }
    return this;
  }
}

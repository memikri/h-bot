import discord from "discord.js";
import DatabaseConnector from "./data/Database";
import dotenv from "dotenv-safe";
import { CommandRegistry, checkPermission } from "./lib/Command";
import PingCommand from "./commands/core/ping";
import * as parser from "discord-command-parser";
import DBCommand from "./commands/dev/db";
import logger from "./lib/Logger";
import BalanceCommand from "./commands/eco/balance";
import { DatabaseInterface } from "./data/Database";
import { EcoSetCommand } from "./commands/eco/admin";
import HelpCommand from "./commands/core/help";

dotenv.config();

export default class Bot {
  private static isInitialized = false;
  public static init(): void {
    if (!this.isInitialized) void new Bot().start();
    this.isInitialized = true;
  }

  requiredPermissions: discord.PermissionResolvable = [
    "VIEW_CHANNEL",
    "READ_MESSAGE_HISTORY",
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "ADD_REACTIONS",
  ];

  client: discord.Client;
  connector: DatabaseConnector;
  database: DatabaseInterface;

  commands: CommandRegistry = new CommandRegistry();

  application!: discord.ClientApplication;

  private constructor() {
    this.client = new discord.Client({
      ws: {
        intents: ["GUILDS", "GUILD_MESSAGES"],
      },
      disableMentions: "everyone",
      shards: "auto",
    });
    this.connector = new DatabaseConnector({
      host: process.env.MARIADB_HOST!,
      port: Number.parseInt(process.env.MARIADB_PORT!),
      username: process.env.MARIADB_USER!,
      password: process.env.MARIADB_PASSWORD!,
      database: process.env.MARIADB_DATABASE!,
    });
    this.database = new DatabaseInterface(this.connector);
    this.commands
      .add(new HelpCommand(this))
      .add(new PingCommand(this))
      .add(new DBCommand(this))
      .add(new BalanceCommand(this))
      .add(new EcoSetCommand(this));
  }

  async start(): Promise<void> {
    await this.client.login(process.env.DISCORD_TOKEN);
    this.application = await this.client.fetchApplication();

    // Bind client events

    this.client.on("message", this._onMessage.bind(this));
  }

  private async _onMessage(msg: discord.Message): Promise<void> {
    if (!msg.guild?.me) return;
    if (msg.channel instanceof discord.DMChannel) return;

    // TODO: get prefix from db
    const parsed = parser.parse(msg, ".", {
      allowSpaceBeforeCommand: true,
      allowBots: true,
    });
    if (!parsed.success) return;
    const command = this.commands.resolve(parsed.command);
    if (!command) {
      logger.debug(`Invalid command: ${parsed.command}`);
      return;
    }

    const missingPermissions = msg.guild.me
      .permissionsIn(msg.channel)
      .missing(new discord.Permissions(this.requiredPermissions).add(command.botPermission));

    if (missingPermissions.length > 0) {
      try {
        await msg.channel.send(`Missing permissions: ${missingPermissions.join(", ")}`);
        // eslint-disable-next-line no-empty
      } catch {
      } finally {
        logger.warn(`Missing permissions in ${msg.guild.name} > #${msg.channel.name}: ${missingPermissions.join(", ")}`);
      }
      return;
    }

    if (!checkPermission(this, msg, command.permission)) {
      logger.debug(`${msg.author.tag} tried to run command ${command.name} without permission.`);
      return;
    }

    try {
      await command.run(msg, parsed.arguments, parsed);
    } catch (err) {
      try {
        await msg.react("❌");
        // eslint-disable-next-line no-empty
      } catch {}
      logger.error(err);
    }
  }
}

import Redis from "ioredis";

export default class RedisManager {
  constructor(readonly connection: Redis.Redis) {}

  /**
   * Returns `true` if the user was not on cooldown.
   * @param resource cooldown container
   * @param id unique identifier
   * @param seconds seconds to be on cooldown
   */
  async cooldown(resource: string, id: string, seconds: number): Promise<boolean> {
    return (await this.connection.set(`${resource}:${id}`, 1, "EX", seconds, "NX")) == "OK";
  }
}

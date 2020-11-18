/* eslint-disable @typescript-eslint/ban-types */
import { createPool, Pool, PoolConnection } from "mariadb";
import { SQLStatement } from "sql-template-strings";
import logger from "../lib/Logger";

export interface IDatabaseConnectorConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  poolSize?: number;
}

abstract class BaseWrapper {
  protected readonly connection: PoolConnection;

  constructor(connection: PoolConnection) {
    this.connection = connection;
  }

  abstract init(): Promise<void>;

  abstract end(error: boolean): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async queryWrap(sql: string, values: Array<any>) {
    if (process.env.SQL_DEBUG === "1")
      logger.debug(
        "SQL-T" +
          JSON.stringify({
            sql: sql.replace(/\s+/g, " "),
            values,
          }),
      );
    return await this.connection.query(sql, values);
  }

  async insert(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.insertId;
  }

  async select<RowT extends {} = {}>(sql: SQLStatement): Promise<RowT[]> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return Array.from(result);
  }

  async selectOne<RowT extends {} = {}>(sql: SQLStatement): Promise<RowT | null> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result[0] || null;
  }

  async update(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.affectedRows;
  }

  async delete(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.affectedRows;
  }
}

export class SerialWrapper extends BaseWrapper {
  async init(): Promise<void> {
    // Nothing to init here
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  end(error: boolean): Promise<void> {
    return Promise.resolve(this.connection.release());
  }
}

export class TransactionWrapper extends BaseWrapper {
  async init(): Promise<void> {
    await this.connection.beginTransaction();
  }

  async end(error: boolean): Promise<void> {
    try {
      if (error) await this.connection.rollback();
      else await this.connection.commit();
    } catch (error2) {
      logger.error(error2);
    }
    this.connection.release();
  }
}

export default class DatabaseConnector {
  private pool: Pool;

  constructor(options: IDatabaseConnectorConfig) {
    this.pool = createPool({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: options.database,
      connectionLimit: options.poolSize || 10,
    });
  }

  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

  async serialize<T>(fn: (conn: SerialWrapper) => Promise<T>): Promise<T> {
    const wrapper = new SerialWrapper(await this.getConnection());
    await wrapper.init();
    let result: T;
    try {
      result = await fn(wrapper);
    } catch (err) {
      await wrapper.end(true);
      throw err;
    }
    await wrapper.end(false);
    return result;
  }

  async transaction<T>(fn: (conn: TransactionWrapper) => Promise<T>): Promise<T> {
    const wrapper = new TransactionWrapper(await this.getConnection());
    await wrapper.init();
    let result: T;
    try {
      result = await fn(wrapper);
    } catch (err) {
      await wrapper.end(true);
      throw err;
    }
    await wrapper.end(false);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async queryWrap(sql: string, values: Array<any>): Promise<any> {
    if (process.env.SQL_DEBUG === "1")
      logger.debug(
        "SQL: " +
          JSON.stringify({
            sql: sql.replace(/\s+/g, " "),
            values,
          }),
      );
    return await this.pool.query(sql, values);
  }

  async insert(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.insertId;
  }

  async select<RowT extends {} = {}>(sql: SQLStatement): Promise<RowT[]> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return Array.from(result);
  }

  async selectOne<RowT extends {} = {}>(sql: SQLStatement): Promise<RowT | null> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result[0] || null;
  }

  async update(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.affectedRows;
  }

  async delete(sql: SQLStatement): Promise<number> {
    const result = await this.queryWrap(sql.sql, sql.values);
    return result.affectedRows;
  }
}

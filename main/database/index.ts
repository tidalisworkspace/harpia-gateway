import log from "electron-log";
import {
  ConnectionError, Options,
  Sequelize
} from "sequelize";
import logger from "../../shared/logger";
import { envname } from "../helpers/environment";
import Config from "./config";

class Database {
  private config: Config;
  private env: string;
  private connection: Sequelize;

  constructor(env: string, config: Config) {
    this.config = config;
    this.env = env;
  }

  private getOptions(): Options {
    return this.config.get(this.env);
  }

  getConnection(): Sequelize {
    if (!this.connection) {
      throw new ConnectionError(new Error("not found database connection"));
    }

    return this.connection;
  }

  async start(): Promise<void> {
    log.info(`database:start ${this.env} environment`);
    const options = this.getOptions();

    const connection = new Sequelize(options);

    try {
      await connection.authenticate();
      this.connection = connection;
    } catch (e) {
      logger.error(`database:start disconnected ${e.name}:${e.message}`);
    }
  }
}

const database = new Database(envname, new Config());

export default database;

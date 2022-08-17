import log from "electron-log";
import { Sequelize } from "sequelize";
import { envname } from "../helpers/environment";
import Config from "./config";

const config = new Config();

class Connection {
  private config: Config;
  private env: string;

  constructor(env: string, config: Config) {
    this.env = env;
    this.config = config;
  }

  getSequelize(): Sequelize {
    log.info("[Database] Connection: from", this.env);
    const options = this.config.get(this.env);
    return new Sequelize(options);
  }
}

const connection = new Connection(envname, config);

export default connection;

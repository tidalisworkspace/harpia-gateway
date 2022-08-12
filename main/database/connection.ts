import log from "electron-log";
import { Sequelize } from "sequelize";
import { envname } from "../helpers/environment";
import Config from "./config";

log.info("Using sequelize options from", envname);

const config = new Config();

class Connection {
  private config: Config;
  private env: string;

  constructor(env: string, config: Config) {
    this.env = env;
    this.config = config;
  }

  getSequelize(): Sequelize {
    const options = this.config.get(this.env);
    return new Sequelize(options);
  }
}

const connection = new Connection(envname, config);

export default connection;

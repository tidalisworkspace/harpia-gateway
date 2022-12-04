import { Dialect, ModelOptions, Options } from "sequelize";
import logger from "../../shared/logger";
import { isDev } from "../helpers/environment";
import store from "../store";

export default class Config {
  private development: Options = {
    username: "postgres",
    password: "postgres",
    host: "localhost",
    port: 15432,
    database: "cdav4",
    dialect: "postgres",
  };

  private production: Options = {
    username: "root",
    password: "root",
    host: "localhost",
    port: 3306,
    database: "cdav4",
    dialect: "mysql",
    logging: false,
  };

  private test: Options = {
    username: "postgres",
    password: "postgres",
    host: "localhost",
    port: 15432,
    database: "cdav4",
    dialect: "postgres",
  };

  private modelOptions: ModelOptions = {
    freezeTableName: true,
    timestamps: false,
  };

  private optionsByEnv: { [key: string]: Options };

  constructor() {
    this.optionsByEnv = {
      development: this.development,
      production: this.production,
      test: this.test,
    };
  }

  private setDatabaseOptions(options: Options) {
    store.set("database", {
      host: options.host,
      port: options.port,
      dialect: options.dialect,
    });

    store.setDatabaseUsername(options.username)
    store.setDatabasePassword(options.password)
  }

  private getDatabaseOptions(envname: string): Options {
    const options = this.optionsByEnv[envname];
    options.username = store.getDatabaseUsername() || options.username
    options.password = store.getDatabasePassword() || options.password
    options.host = store.get("database.host", options.host) as string;
    options.port = store.get("database.port", options.port) as number;
    options.dialect = store.get("database.dialect", options.dialect) as Dialect;

    return options;
  }

  private logging(sql) {
    if (!isDev) {
      return;
    }

    sql = sql.replace("Executing (default):", "").trim();

    logger.debug(`database:query ${sql}`);
  }

  get(envname: string): Options {
    const options = this.getDatabaseOptions(envname);

    this.setDatabaseOptions(options);

    return {
      ...options,
      define: this.modelOptions,
      logging: this.logging,
    };
  }
}

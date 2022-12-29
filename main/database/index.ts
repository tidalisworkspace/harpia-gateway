import { ConnectionError, Dialect, Options, Sequelize } from "sequelize";
import logger from "../../shared/logger";
import { envname } from "../helpers/environment";
import Config from "./config";
import equipamentoModel from "./models/equipamento.model";
import eventoModel from "./models/evento.model";
import parametroModel from "./models/parametro.model";
import pessoaModel from "./models/pessoa.model";
import veiculoModel from "./models/veiculo.model";

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

  getDialect(): Dialect {
    return this.config.get(this.env).dialect;
  }

  getConnection(): Sequelize {
    if (!this.connection) {
      throw new ConnectionError(new Error("not found database connection"));
    }

    return this.connection;
  }

  async start(): Promise<void> {
    logger.info(`database:start ${this.env} environment`);
    const options = this.getOptions();

    const connection = new Sequelize(options);

    try {
      await connection.authenticate();

      this.connection = connection;

      await Promise.all([
        equipamentoModel().sync(),
        eventoModel().sync(),
        parametroModel().sync(),
        pessoaModel().sync(),
        veiculoModel().sync(),
      ]);
    } catch (e) {
      logger.error(`database:start disconnected ${e.name}:${e.message}`);
    }
  }
}

const database = new Database(envname, new Config());

export default database;

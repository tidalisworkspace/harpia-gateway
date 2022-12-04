import ElectronStore from "electron-store";
import logger from "../shared/logger";
import Cypher, { CypherData } from "./helpers/cypher";

const templates = {
  database: {
    username: "database.username",
    password: "database.password",
  },
  hardware: {
    connection: "hardware.{0}.connection",
  },
  whitelist: "whitelist.{0}",
};

class Store extends ElectronStore {
  private cypher: Cypher;

  constructor() {
    super({ clearInvalidConfig: true });
    this.cypher = new Cypher();
  }

  private toKey(template: string, ...values: string[]) {
    const key = values.reduce(
      (accumulator, current, index) =>
        accumulator.replace(`{${index}}`, current.replaceAll(".", "")),
      template
    );

    logger.debug(
      `store:to-key generated key ${key} from template ${template} values=${values.join(
        ","
      )}`
    );

    return key;
  }

  private fromWhiteList(whiteList: string[]): string {
    return whiteList
      .filter(Boolean)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(",");
  }

  private toWhiteList(value: string): string[] {
    return (value || "")
      .split(",")
      .filter(Boolean)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getSecret(key: string, defaultValue?: any): string {
    const value = super.get(key);

    if (!value) {
      return defaultValue;
    }

    return this.cypher.decrypt(value as CypherData);
  }

  private setSecret(key: string, value?: string) {
    super.set(key, this.cypher.encrypt(value));
  }

  getDatabaseUsername(): string {
    return this.getSecret(templates.database.username);
  }

  setDatabaseUsername(username: string) {
    this.setSecret(templates.database.username, username);
  }

  getDatabasePassword(): string {
    return this.getSecret(templates.database.password);
  }

  setDatabasePassword(password: string) {
    this.setSecret(templates.database.password, password);
  }

  getHardwareConnection(ip: string) {
    const key = this.toKey(templates.hardware.connection, ip);
    return super.get(key);
  }

  setHardwareConnection(ip: string, connection: string) {
    const key = this.toKey(templates.hardware.connection, ip);
    super.set(key, connection);
  }

  setWhiteList(ip: string, whiteList: string[]): void {
    const key = this.toKey(templates.whitelist, ip);
    super.set(key, this.fromWhiteList(whiteList));
  }

  getWhiteList(ip: string): string[] {
    const key = this.toKey(templates.whitelist, ip);
    const value = super.get(key) as string;
    return this.toWhiteList(value);
  }

  deleteWhiteList(ip: string): void {
    const key = this.toKey(templates.whitelist, ip);
    super.delete(key);
  }
}

const store = new Store();

export default store;

import ElectronStore from "electron-store";
import Cypher, { CypherData } from "./helpers/cypher";

class Store extends ElectronStore {
  private cypher: Cypher;

  constructor() {
    super({ clearInvalidConfig: true });
    this.cypher = new Cypher();
  }

  private normalize(value: string) {
    return value.replaceAll(".", "");
  }

  getSecret(key: string, defaultValue?: any): string {
    const value = super.get(key);

    if (!value) {
      return defaultValue;
    }

    return this.cypher.decrypt(value as CypherData);
  }

  setSecret(key: string, value?: string) {
    super.set(key, this.cypher.encrypt(value));
  }

  getHardwareConnection(ip: string) {
    const key = this.normalize(ip);
    return super.get(`hardware.${key}.connection`);
  }

  setHardwareConnection(ip: string, connection: string) {
    const key = this.normalize(ip);
    super.set(`hardware.${key}.connection`, connection);
  }

  getWhiteList(ip: string): string[] {
    const key = this.normalize(ip);
    const value = super.get(`whitelist.${key}`) as string;
    return value.split(",");
  }

  deleteWhiteList(ip: string): void {
    const key = this.normalize(ip);
    super.set(`whitelist.${key}`, "");
  }
}

const store = new Store();

export default store;

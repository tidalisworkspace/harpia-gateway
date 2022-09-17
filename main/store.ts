import ElectronStore from "electron-store";
import Cypher, { CypherData } from "./helpers/cypher";

class Store extends ElectronStore {
  private cypher: Cypher;

  constructor() {
    super({ clearInvalidConfig: true });
    this.cypher = new Cypher();
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
    const key = ip.replaceAll(".", "");
    return super.get(`hardware.${key}.connection`);
  }

  setHardwareConnection(ip: string, connection: string) {
    const key = ip.replaceAll(".", "");
    super.set(`hardware.${key}.connection`, connection);
  }
}

const store = new Store();

export default store;

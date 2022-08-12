import ElectronStore from "electron-store";
import Cypher, { CypherData } from "./helpers/cypher";

class Store extends ElectronStore {
  private cypher: Cypher;

  constructor() {
    super({ clearInvalidConfig: true });
    this.cypher = new Cypher();
  }

  setSecret(key: string, value?: string) {
    super.set(key, this.cypher.encrypt(value));
  }

  getSecret(key: string, defaultValue?: any): string {
    const value = super.get(key);

    if (!value) {
      return defaultValue;
    }

    return this.cypher.decrypt(value as CypherData);
  }
}

const store = new Store();

export default store;

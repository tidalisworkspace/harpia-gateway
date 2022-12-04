import ElectronStore from "electron-store";
import Cypher, { CypherData } from "./helpers/cypher";

class Store extends ElectronStore {
  private cypher: Cypher;

  constructor() {
    super({ clearInvalidConfig: true });
    this.cypher = new Cypher();
  }

  private toKey(value: string) {
    return value.replaceAll(".", "");
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
    const key = this.toKey(ip);
    return super.get(`hardware.${key}.connection`);
  }

  setHardwareConnection(ip: string, connection: string) {
    const key = this.toKey(ip);
    super.set(`hardware.${key}.connection`, connection);
  }

  setWhiteList(ip: string, whiteList: string[]): void {
    const key = this.toKey(ip);
    super.set(`whitelist.${key}`, this.fromWhiteList(whiteList));
  }

  getWhiteList(ip: string): string[] {
    const key = this.toKey(ip);
    const value = super.get(`whitelist.${key}`) as string;
    return this.toWhiteList(value);
  }

  deleteWhiteList(ip: string): void {
    const key = this.toKey(ip);
    super.delete(`whitelist.${key}`);
  }
}

const store = new Store();

export default store;

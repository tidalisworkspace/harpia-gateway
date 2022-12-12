import ElectronStore from "electron-store";
import logger from "../shared/logger";
import Cypher, { CypherData } from "./helpers/cypher";
import { CameraQueueMessage } from "./socket-server/camera-handlers/types";

const templates = {
  database: {
    username: "database.username",
    password: "database.password",
  },
  hardware: {
    connection: "hardware.{0}.connection",
  },
  camera: {
    whitelist: "camera.{0}.whitelist",
    queue: "camera.{0}.queue",
  },
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

  private toWhiteList(whiteList: string[]): string[] {
    if (!whiteList || !whiteList.length) {
      return [];
    }

    return whiteList
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

  setCameraWhiteList(ip: string, values: string[]): void {
    const key = this.toKey(templates.camera.whitelist, ip);
    const whiteList = this.toWhiteList(values);
    super.set(key, whiteList);
  }

  getCameraWhiteList(ip: string): string[] {
    const key = this.toKey(templates.camera.whitelist, ip);
    const values = super.get(key) as string[];

    return this.toWhiteList(values);
  }

  deleteCameraWhiteList(ip: string): void {
    const key = this.toKey(templates.camera.whitelist, ip);
    super.delete(key);
  }

  private getCameraQueueMessages(ip: string): CameraQueueMessage[] {
    const key = this.toKey(templates.camera.queue, ip);
    return super.get(key, []) as CameraQueueMessage[];
  }

  private setCameraQueueMessages(
    ip: string,
    messages: CameraQueueMessage[]
  ): void {
    const key = this.toKey(templates.camera.queue, ip);
    super.set(key, messages);
  }

  addCameraQueueMessage(ip: string, message: CameraQueueMessage): void {
    const messages = this.getCameraQueueMessages(ip);
    messages.push(message);

    this.setCameraQueueMessages(ip, messages);
  }

  getFirstCameraQueueMessage(ip: string): CameraQueueMessage {
    const messages = this.getCameraQueueMessages(ip);
    const message = messages.shift();

    this.setCameraQueueMessages(ip, messages);

    return message;
  }
}

const store = new Store();

export default store;

import ElectronStore from "electron-store";
import Cypher, { CypherData } from "./helpers/cypher";
import {
  CameraCommand,
  CameraQueueMessage,
  CameraQueueName,
  CameraQueues,
} from "./socket-server/camera-handlers/types";

const templates = {
  database: {
    username: "database.username",
    password: "database.password",
  },
  hardware: {
    connection: "hardware.{0}.connection",
  },
  camera: {
    queue: {
      http: "camera.{0}.queue.http",
      socket: "camera.{0}.queue.socket",
    },
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

    return key;
  }

  private formatPlates(plates: string[]): string[] {
    if (!plates || !plates.length) {
      return [];
    }

    return plates
      .filter(Boolean)
      .map((plate) => plate.trim())
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

  private getCameraQueue(
    ip: string,
    queueName: CameraQueueName
  ): CameraQueueMessage[] {
    const key = this.toKey(templates.camera.queue[queueName], ip);
    return super.get(key, []) as CameraQueueMessage[];
  }

  private setCameraQueue(
    ip: string,
    queueName: CameraQueueName,
    messages: CameraQueueMessage[]
  ) {
    const key = this.toKey(templates.camera.queue[queueName], ip);
    super.set(key, messages);
  }

  private addCameraQueue(
    ip: string,
    queueName: CameraQueueName,
    message: CameraQueueMessage
  ): void {
    const messages = this.getCameraQueue(ip, queueName);
    messages.push(message);
    this.setCameraQueue(ip, queueName, messages);
  }

  private getFirstCameraQueue(
    ip: string,
    queueName: CameraQueueName
  ): CameraQueueMessage {
    const messages = this.getCameraQueue(ip, queueName);
    const message = messages.shift();

    this.setCameraQueue(ip, queueName, messages);

    return message;
  }

  getFirstCameraQueueHttp(ip: string): CameraQueueMessage {
    const message = this.getFirstCameraQueue(ip, CameraQueues.HTTP);

    if (!message) {
      return message;
    }

    if (message.command === CameraCommand.ADD_WHITE_LIST) {
      message.params = this.formatPlates(message.params);
      return message;
    }

    return message;
  }

  addCameraQueueHttp(ip: string, message: CameraQueueMessage): void {
    if (message.command === CameraCommand.ADD_WHITE_LIST) {
      message.params = this.formatPlates(message.params);
    }

    this.addCameraQueue(ip, CameraQueues.HTTP, message);
  }

  getFirstCameraQueueSocket(ip: string): CameraQueueMessage {
    return this.getFirstCameraQueue(ip, CameraQueues.SOCKET);
  }
}

const store = new Store();

export default store;

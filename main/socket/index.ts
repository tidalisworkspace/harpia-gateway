import net, { Server } from "net";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import { handleConnection } from "./connection";
import storage from "./connection/storage";

class Socket {
  private defaultPort: number = 5000;
  private port: number;

  getPort() {
    return this.port;
  }

  private async loadPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne();

      if (!parametro) {
        logger.warn(
          `socket:server parameter not found, using port ${this.defaultPort} (default)`
        );

        return this.defaultPort;
      }

      if (!parametro.portaSocket) {
        logger.warn(
          `socket:server port value not found, using port ${this.defaultPort} (default)`
        );

        return this.defaultPort;
      }

      return parametro.portaSocket;
    } catch (e) {
      logger.warn(
        `socket:server error, using port ${this.defaultPort} (default) ${e.message}`,
        e
      );

      return this.defaultPort;
    }
  }

  private getServer(): Server {
    const server = net.createServer();
    server.on("connection", handleConnection);
    server.on("close", () => logger.info("socket:server connection closed"));
    server.on("error", (e: Error) =>
      logger.error(`socket:server connection error ${e.name}:${e.message}`)
    );

    return server;
  }

  async start(): Promise<void> {
    this.port = await this.loadPort();
    const server = this.getServer();

    return new Promise((resolve) => {
      server.listen({ host: "0.0.0.0", port: this.port }, () => {
        logger.info(`socket:server listening at ${this.port}`);
        resolve();
      });
    });
  }

  private send(connectionId: string, message: string) {
    const connection = storage.get(connectionId);

    if (!connection) {
      return;
    }

    logger.debug(`socket:server:${connectionId} sending message ${message}`);

    try {
      connection.write(message, "utf-8");
    } catch (e) {
      logger.error(
        `socket:server:${connectionId} error ${e.name}:${e.message}`
      );
    }
  }

  private formatClient(client: string): string {
    return client.padEnd(2, "0");
  }

  private formatMessage(...texts: string[]): string {
    return texts.join("@");
  }

  sendAckMessage(connectionId: string, client: string) {
    client = this.formatClient(client);
    this.send(connectionId, `<HKRC>${client}@`);
  }

  sendSuccessMessage(connectionId: string, client: string, message: string) {
    client = this.formatClient(client);
    message = this.formatMessage(client, message);
    this.send(connectionId, `<HKOK>${message}`);
  }

  sendFailureMessage(
    connectionId: string,
    client: string,
    ...errors: string[]
  ) {
    client = this.formatClient(client);
    const message = this.formatMessage(client, ...errors);
    this.send(connectionId, `<HKER>${message}`);
  }

  sendMessageToAll(message: string) {
    const connectionIds = storage.getIds();

    for (const connectionId of connectionIds) {
      this.send(connectionId, message);
    }
  }

  sendAliveMessage() {
    this.sendMessageToAll("<HKVI>@ESTOU VIVO@");
  }
}

const socket = new Socket();

export default socket;

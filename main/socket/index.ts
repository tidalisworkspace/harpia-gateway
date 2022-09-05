import net, { Server } from "net";
import parametroModel from "../database/models/parametro.model";
import logger from "../../shared/logger";
import { handleConnection } from "./connection";
import storage from "./connection/storage";

class Socket {
  private defaultPort: number = 5000;

  async getPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne();
      return parametro?.portaSocket || this.defaultPort;
    } catch (e) {
      logger.warn("[Socket] Server: using default port;", e.message);
      return this.defaultPort;
    }
  }

  async start(): Promise<void> {
    const port = await this.getPort();

    const server = net.createServer();
    server.on("connection", handleConnection);
    server.on("close", () => logger.info("Socket closed"));
    server.on("error", (error: Error) =>
      logger.error("[Socket] Error: in connection>", error.message)
    );
    server.on("listening", () =>
      logger.info(`[Socket] Server: listening at ${port}`)
    );

    server.listen(port, "0.0.0.0");

    return new Promise((resolve) => server.on("listening", resolve));
  }

  send(connectionId: string, message: string) {
    const connection = storage.get(connectionId);

    if (!connection) {
      logger.warn(
        `[Socket] Connection [${connectionId}]: not found by id ${connectionId}`
      );
      return;
    }

    logger.debug(
      `[Socket] Connection [${connectionId}]: sending message ${message}`
    );

    try {
      connection.write(message, "utf-8");
    } catch (e) {
      logger.warn(
        `[Socket] Connection [${connectionId}]: get an error when send message ${e.message}`
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

  sendFailureMessage(connectionId: string, client: string, ...errors: string[]) {
    client = this.formatClient(client);
    const message = this.formatMessage(client, ...errors);
    this.send(connectionId, `<HKER>${message}`);
  }
}

const socket = new Socket();

export default socket;

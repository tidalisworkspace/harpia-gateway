import net, { Server } from "net";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import ConnectionManager from "./connection-manager/connection-manager";
import storage from "./connection-manager/storage";
import { SendMode } from "./types/socket-server.types";

export default class SocketServer {
  private defaultPort: number = 5000;
  private port: number;
  private state: string = "stopped";
  private connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
  }

  getPort() {
    return this.port;
  }

  getState() {
    return this.state;
  }

  private async loadPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne({
        attributes: ["portaSocket"],
      });

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
        `socket:server error, using port ${this.defaultPort} (default) ${e.name}:${e.message}`
      );

      return this.defaultPort;
    }
  }

  private createServer(): Server {
    const server = net.createServer();

    server.on("connection", (connection) =>
      this.connectionManager.handleConnection(connection)
    );

    server.on("close", () => logger.info("socket:server connection closed"));

    server.on("error", (e: NodeJS.ErrnoException) => {
      logger.error(`socket:server error ${e.name}:${e.message}`);

      if (e.code === "EADDRINUSE") {
        this.state = "error";
      }
    });

    server.on("listening", () => {
      logger.info(`socket:server listening at ${this.port}`);
      this.state = "running";
    });

    return server;
  }

  async start(): Promise<void> {
    this.state = "starting";
    this.port = await this.loadPort();
    const server = this.createServer();
    server.listen({ host: "0.0.0.0", port: this.port });
  }

  private send(
    connectionId: string,
    message: string | Buffer,
    mode: SendMode = "LOG_AND_SEND",
    encoding: BufferEncoding = "utf-8"
  ) {
    const item = storage.get(connectionId);

    if (!item) {
      return;
    }

    if (mode === "LOG_AND_SEND") {
      logger.debug(
        `socket:server:${connectionId} sending message ${Buffer.from(
          message
        ).toString(encoding)}`
      );
    }

    try {
      item.connection.write(message);
    } catch (e) {
      logger.error(
        `socket:server:${connectionId} error ${e.name}:${e.message}`
      );
    }
  }

  broadcast(message: string, mode: SendMode = "LOG_AND_SEND") {
    if (mode === "LOG_AND_SEND") {
      logger.debug(`socket:server sending message to all ${message}`);
    }

    const connectionIds = storage.getIds("cda");

    for (const connectionId of connectionIds) {
      this.send(connectionId, message, "JUST_SEND");
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

  sendPlate(connectionId: string, client: string, message: string) {
    client = this.formatClient(client);
    message = this.formatMessage(client, message);
    this.send(connectionId, `<PLEV>${message}`);
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

  sendAliveMessage() {
    const message = "<HKVI>@ESTOU VIVO@";
    this.broadcast(message, "JUST_SEND");
  }

  sendToCamera(connectionId: string, header: Buffer, body: string) {
    const bodyBuffer = Buffer.alloc(body.length);
    bodyBuffer.write(body);

    const message = Buffer.concat([header, bodyBuffer]);
    this.send(connectionId, message, "LOG_AND_SEND", "hex");
  }
}

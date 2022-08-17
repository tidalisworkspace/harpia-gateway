import net, { Server } from "net";
import parametroModel from "../database/models/parametro.model";
import logger from "../../shared/logger";
import { handleConnection } from "./connection";

class Socket {
  private defaultPort: number = 5000;

  async getPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne();
      return parametro?.portaSocket || this.defaultPort;
    } catch (e) {
      logger.error("[Socket] Error: when trying get port number>", e.message);
      return this.defaultPort;
    }
  }

  async start(): Promise<void> {
    const port = await this.getPort();

    const server: Server = net.createServer();
    server.on("connection", handleConnection);
    server.on("close", () => logger.info("Socket closed"));
    server.on("error", (error: Error) =>
      logger.error("[Socket] Error: in connection>", error.message)
    );
    server.on("listening", () => logger.info(`[Socket] Server: listening at ${port}`));

    server.listen(port, "0.0.0.0");

    return new Promise((resolve) => server.on("listening", resolve));
  }
}

const socket = new Socket();

export default socket;

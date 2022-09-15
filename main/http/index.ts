import express, { Express } from "express";
import bodyParser from "body-parser";
import logger from "../../shared/logger";
import hikvisionEventsRoute from "./routes/hikvisionEvents.route";
import intelbrasEventsRoute from "./routes/intelbrasEvents.route";
import parametroModel from "../database/models/parametro.model";

class Http {
  private defaultPort: number = 9000;
  private port: number;

  getPort(): number {
    return this.port;
  }

  private async loadPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne();

      if (!parametro) {
        logger.warn(
          `http:server parameter not found, using port ${this.defaultPort} (default)`
        );

        return this.defaultPort;
      }

      if (!parametro.portaHttp) {
        logger.warn(
          `http:server port value not found, using port ${this.defaultPort} (default)`
        );

        return this.defaultPort;
      }

      return parametro.portaHttp;
    } catch (e) {
      logger.warn(
        `http:server error, using port ${this.defaultPort} (default) ${e.message}`,
        e
      );

      return this.defaultPort;
    }
  }

  private newServer(): Express {
    const server = express();
    server.use(bodyParser.raw({ type: "*/*" }));
    server.use("/hikvision/events", hikvisionEventsRoute);
    server.use("/intelbras/events", intelbrasEventsRoute);

    return server;
  }

  async start(): Promise<void> {
    this.port = await this.loadPort();
    const server = this.newServer();

    return new Promise((resolve) => {
      server.listen(this.port, () => {
        logger.info(`http:server listening at ${this.port}`);
        resolve();
      });
    });
  }
}

const http = new Http();

export default http;

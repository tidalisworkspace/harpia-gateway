import bodyParser from "body-parser";
import express, { Express } from "express";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import hikvisionEventsRoute from "./routes/hikvisionEvents.route";
import intelbrasEventsRoute from "./routes/intelbrasEvents.route";

class Http {
  private ip: string = "0.0.0.0";
  private port: number = 9000;
  private state: string = "stopped";

  getIp(): string {
    return this.ip;
  }

  getPort(): number {
    return this.port;
  }

  getState() {
    return this.state;
  }

  private async loadIp(): Promise<string> {
    try {
      const parametro = await parametroModel().findOne({
        attributes: ["ipHttp"],
      });

      if (!parametro) {
        logger.warn(
          `http:server parameter not found, using ${this.ip} as events server ip`
        );

        return this.ip;
      }

      if (!parametro.ipHttp) {
        logger.warn(
          `http:server ip value not found, using ${this.ip} as events server ip`
        );

        return this.ip;
      }

      return parametro.ipHttp;
    } catch (e) {
      logger.warn(`http:server error, using ${this.ip} as events server ip`);

      return this.ip;
    }
  }

  private async loadPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne({
        attributes: ["portaHttp"],
      });

      if (!parametro) {
        logger.warn(
          `http:server parameter not found, using port ${this.port} (default)`
        );

        return this.port;
      }

      if (!parametro.portaHttp) {
        logger.warn(
          `http:server port value not found, using port ${this.port} (default)`
        );

        return this.port;
      }

      return parametro.portaHttp;
    } catch (e) {
      logger.warn(
        `http:server error, using port ${this.port} (default) ${e.name}:${e.message}`
      );

      return this.port;
    }
  }

  private createApp(): Express {
    const app = express();
    app.use(bodyParser.raw({ type: "*/*" }));
    app.use("/hikvision/events", hikvisionEventsRoute);
    app.use("/intelbras/events", intelbrasEventsRoute);
    return app;
  }

  private createrServer(app: Express) {
    const server = app.listen(this.port);

    server.on("listening", () => {
      logger.info(`http:server listening at ${this.port}`);
      this.state = "running";
    });

    server.on("error", (e: NodeJS.ErrnoException) => {
      logger.error(`http:server error ${e.name}:${e.message}`);

      if (e.code === "EADDRINUSE") {
        this.state = "error";
      }
    });
  }

  async start(): Promise<void> {
    this.state = "starting";
    this.ip = await this.loadIp();
    this.port = await this.loadPort();
    const app = this.createApp();
    this.createrServer(app);
  }
}

const http = new Http();

export default http;

import bodyParser from "body-parser";
import express, { Express } from "express";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import hikvisionEventsRoute from "./routes/hikvision-events.route";
import intelbrasEventsRoute from "./routes/intelbras-events.route";

export default class HttpServer {
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

      if (!parametro || !parametro.ipHttp) {
        logger.warn(`http-server:load-ip using default ip`);

        return this.ip;
      }

      return parametro.ipHttp;
    } catch (e) {
      logger.error(
        `http-server:load-ip using default ip ${e.name}:${e.message}`
      );

      return this.ip;
    }
  }

  private async loadPort(): Promise<number> {
    try {
      const parametro = await parametroModel().findOne({
        attributes: ["portaHttp"],
      });

      if (!parametro || !parametro.portaHttp) {
        logger.warn(`http-server:load-port using default port`);

        return this.port;
      }

      return parametro.portaHttp;
    } catch (e) {
      logger.warn(
        `http-server:load-port using default port ${e.name}:${e.message}`
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
      logger.info(`http-server:create-server listening ${this.port}`);
      this.state = "running";
    });

    server.on("error", (e: NodeJS.ErrnoException) => {
      logger.error(`http-server:create-server ${e.name}:${e.message}`);

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

import cron from "node-cron";
import { v4 as uuid } from "uuid";
import logger from "../../shared/logger";
import equipamentoModel from "../database/models/equipamento.model";
import { ControlidClient } from "../device-clients/controlid.client";
import service from "../http-server/services/controlid-events.service";
import ControlIdEvent, {
  ObjectChange,
} from "../http-server/types/ControlIdEvents";
import defaultJobOptions from "./default-job-options";

async function processEvents() {
  const equipamentos = await equipamentoModel()
    .unscoped()
    .findAll({
      attributes: ["ip", "porta"],
      where: {
        habilitado: "S",
        modelo: "ID FACE G",
      },
      logging: false,
    });

  const logId = uuid();

  for (const equipamento of equipamentos) {
    const { ip, porta } = equipamento;

    const client = await new ControlidClient().init(ip, porta);

    const events = await client.getEvents();

    if (!events.length) {
      return;
    }

    logger.debug(
      `job:load-controlid-events:${ip} ${events.length} events found`
    );

    const objectChanges: ObjectChange[] = events.map((event) => ({
      object: "access_logs",
      type: "inserted",
      values: event,
    }));

    const event: ControlIdEvent = {
      logId,
      ip,
      device_id: null,
      object_changes: objectChanges,
    };

    await service.create(event);
  }
}

let running = false;

async function execute() {
  if (running) {
    logger.debug(`job:load-controlid-events already running`);
    return;
  }

  running = true;

  try {
    await processEvents();
  } catch (e) {
    logger.error(`job:load-controlid-events ${e.name}:${e.message}`);
  }

  running = false;
}

export default cron.schedule("*/30 * * * * *", execute, defaultJobOptions);

import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/intelbras-events.service";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3];
}

async function create(req: Request, res: Response): Promise<void> {
  const logId = uuid();

  try {
    const ip = getIp(req);

    const eventBuffer = responseReader.getEvent(req.body, "<ITBF>");
    const eventString = eventBuffer.toString("utf-8");
    const eventJson = JSON.parse(eventString);
    const event = { logId, ip, ...eventJson };

    logger.debug(
      `http-server:intelbras-events-controller:create:${logId} ${JSON.stringify(
        event
      )}`
    );

    await service.create(event);

    res.status(200).end();
  } catch (e) {
    logger.error(
      `http-server:intelbras-events-controller:create:${logId} ${e.name}:${e.message}`
    );

    res.status(500).end();
  }
}

export default { create };

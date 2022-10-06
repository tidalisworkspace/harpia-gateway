import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/hikvision-events.service";

async function create(req: Request, res: Response, next): Promise<void> {
  const logId = uuid();

  try {
    const eventBuffer = responseReader.getEvent(req.body, "<HIKV>");
    const eventString = eventBuffer.toString("utf-8");
    const eventJson = JSON.parse(eventString);
    const event = { logId, ...eventJson };

    logger.debug(
      `http-server:hikvision-events-controller:create:${logId} ${JSON.stringify(
        event
      )}`
    );

    await service.create(event);

    res.status(200).end();
  } catch (e) {
    logger.error(
      `http-server:hikvision-events-controller:create:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { create };

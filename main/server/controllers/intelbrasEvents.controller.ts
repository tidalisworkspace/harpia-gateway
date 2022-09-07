import { Request, Response } from "express";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/intelbrasEvents.service";
import IntelbrasEvent from "../types/IntelbrasEvent";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3]
}

async function create(req: Request, res: Response, next): Promise<void> {
  try {
    const eventBuffer = responseReader.getEvent(req.body, "<ITBF>");

    const event: IntelbrasEvent = JSON.parse(eventBuffer.toString("utf-8"));
    event.ip = getIp(req)

    logger.debug(
      `[Server] IntelbrasEventsController [${
        event.Time
      }]: create event ${JSON.stringify(event)}`
    );

    await service.create(event);

    res.status(200).end();
  } catch (err) {
    logger.error(
      `[Server] IntelbrasEventsController: get an error when create event ${err.message}`
    );
    next(err);
  }
}

export default { create };

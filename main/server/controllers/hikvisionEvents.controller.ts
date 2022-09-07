import { Request, Response } from "express";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/hikvisionEvents.service";
import HikvisionEvent from "../types/HikvisionEvent";

async function create(req: Request, res: Response, next): Promise<void> {
  try {
    const eventBuffer = responseReader.getEvent(req.body, "<HIKV>");

    const event: HikvisionEvent = JSON.parse(eventBuffer.toString("utf-8"));

    logger.debug(
      `[Server] HikvisionEventsController [${
        event.dateTime
      }]: create event ${JSON.stringify(event)}`
    );

    await service.create(event);

    res.status(200).end();
  } catch (err) {
    logger.error(
      `[Server] HikvisionEventsController: get an error when create event ${err.message}`
    );
    next(err);
  }
}

export default { create };

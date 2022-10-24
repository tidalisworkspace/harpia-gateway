import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/hikvision-events.service";

async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  logger.debug(JSON.stringify(req.headers));
  const logId = uuid();

  try {
    const eventBuffer = responseReader.getEvent(req.body, "<HIKV>");
    const eventJson = JSON.parse(eventBuffer.toString());
    const event = { logId, ...eventJson };
    const eventString = JSON.stringify(event);

    logger.debug(
      `http-server:hikvision-events-controller:create:${logId} ${eventString}`
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

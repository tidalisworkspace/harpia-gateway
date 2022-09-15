import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/hikvisionEvents.service";

async function create(req: Request, res: Response, next): Promise<void> {
  const logId = uuid();

  try {
    const eventBuffer = responseReader.getEvent(req.body, "<HIKV>");
    const eventString = eventBuffer.toString("utf-8");

    logger.debug(
      `http:hikvisionEventsController:${logId} request ${eventString}`
    );

    await service.create({ logId, ...JSON.parse(eventString) });

    res.status(200).end();
  } catch (e) {
    logger.error(
      `http:hikvisionEventsController:${logId} error ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { create };

import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/intelbras-events.service";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3];
}

async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const logId = uuid();

  try {
    const ip = getIp(req);

    const eventBuffer = responseReader.getEvent(req.body, "<ITBF>");
    const eventJson = JSON.parse(eventBuffer.toString());
    const event = { logId, ip, ...eventJson };
    const eventString = JSON.stringify(event);

    logger.debug(
      `http-server:intelbras-events-controller:create:${logId} ${eventString}`
    );

    await service.create(event);

    res.status(200).end();
  } catch (e) {
    logger.error(
      `http-server:intelbras-events-controller:create:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { create };

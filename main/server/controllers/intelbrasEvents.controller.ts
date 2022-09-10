import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import responseReader from "../../helpers/response-reader";
import service from "../services/intelbrasEvents.service";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3];
}

async function create(req: Request, res: Response, next): Promise<void> {
  const logId = uuid();

  try {
    const eventBuffer = responseReader.getEvent(req.body, "<ITBF>");
    const eventString = eventBuffer.toString("utf-8");

    logger.debug(`api:intelbrasEventsController:${logId} request ${eventString}`);

    const ip = getIp(req);
    
    await service.create({ logId, ip, ...JSON.parse(eventString) });

    res.status(200).end();
  } catch (e) {
    logger.error(`api:intelbrasEventsController:${logId} error ${e.message}`, e);

    next(e);
  }
}

export default { create };

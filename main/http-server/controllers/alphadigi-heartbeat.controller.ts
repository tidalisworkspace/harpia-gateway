import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import service from "../services/alphadigi-heartbeat.service";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3];
}

async function heartbeat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const logId = uuid();

  try {
    const ip = getIp(req);

    const requestBody = JSON.parse(req.body.toString());
    Object.assign(requestBody, { ip, logId });
    const requestBodyString = JSON.stringify(requestBody);

    const responseBody = await service.getResponseBody(requestBody);
    const responseBodyString = JSON.stringify(responseBody);

    logger.debug(
      `http-server:alphadigi-heartbeat-controller:heartbeat:${logId} request=${requestBodyString} response=${responseBodyString}`
    );

    res.send(responseBody).status(200).end();
  } catch (e) {
    logger.error(
      `http-server:alphadigi-heartbeat-controller:heartbeat:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { heartbeat };

import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";

function getIp(req: Request) {
  return req.socket.remoteAddress.split(":")[3];
}

async function push(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const logId = uuid();

  try {
    const ip = getIp(req);

    logger.debug(
      `http-server:alphadigi-push-controller:push:${logId} ${req.body}`
    );
  } catch (e) {
    logger.error(
      `http-server:alphadigi-push-controller:push:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { push };
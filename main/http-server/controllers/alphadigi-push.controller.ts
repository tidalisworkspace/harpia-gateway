import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import service from "../services/alphadigi-push.service";

async function push(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const logId = uuid();

  try {
    const eventBuffer: Buffer = req.body;
    const eventJson = JSON.parse(eventBuffer.toString());
    const event = { logId, ...eventJson };
    const eventString = JSON.stringify(event);

    logger.debug(
      `http-server:alphadigi-push-controller:push:${logId} ${eventString}`
    );

    await service.create(event);

    res
      .send({
        Response_AlarmInfoPlate: {
          info: "no",
          content: "retransfer_stop",
          is_pay: "true",
        },
      })
      .status(200)
      .end();
  } catch (e) {
    logger.error(
      `http-server:alphadigi-push-controller:push:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { push };

import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";
import socketServer from "../../socket-server";

async function push(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const logId = uuid();

  // TODO implementar logica para criar evento e enviar placa para cda

  try {
    logger.debug(
      `http-server:alphadigi-push-controller:push:${logId} ${req.body}`
    );

    const responseBody = {
      Response_AlarmInfoPlate: {
        info: "no",
        content: "retransfer_stop",
        is_pay: "true",
      },
    };

    socketServer.broadcastPlate(
      req.body.AlarmInfoPlate.result.PlateResult.license
    );

    res.send(responseBody).status(200).end();
  } catch (e) {
    logger.error(
      `http-server:alphadigi-push-controller:push:${logId} ${e.name}:${e.message}`
    );

    next(e);
  }
}

export default { push };

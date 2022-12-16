import { add, format } from "date-fns";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import store from "../../store";

function toTimestamp(date: Date): string {
  return format(date, "yyyyMMddHHmmss");
}

function getStarTime(): string {
  return toTimestamp(new Date());
}

function getEndTime(): string {
  return "20371010162030";
}

const defaultHeartbeatResponseBody = {
  Response_Heartbeat: {
    info: "no",
    shutoff: "no",
    snapnow: "no",
  },
};

type ResponseBodyCreator = (params?: any) => any;

const addWhiteListResponseBodyCreator: ResponseBodyCreator = (
  plates: string[]
): any => {
  const startTime = getStarTime();
  const endTime = getEndTime();

  const data = plates.map((plate) => ({
    carnum: plate,
    startime: startTime,
    endtime: endTime,
  }));

  const responseBody = {
    addWhiteList: {
      add_data: data,
    },
  };

  return responseBody;
};

const openDoorResponseBodyCreator: ResponseBodyCreator = (): any => {
  return {
    Response_Heartbeat: {
      info: "ok",
      shutoff: "no",
      snapnow: "no",
    },
  };
};

const responseBodyCreators: { [key: string]: ResponseBodyCreator } = {
  add_white_list: addWhiteListResponseBodyCreator,
  open_door: openDoorResponseBodyCreator,
};

function getHeartbeatResponse(requestBody: any): any {
  const { logId, ip } = requestBody;

  const message = store.getFirstCameraQueueHttp(ip);

  if (!message) {
    return defaultHeartbeatResponseBody;
  }

  const responseBodyCreator = responseBodyCreators[message.command];

  if (!responseBodyCreator) {
    logger.warn(
      `http-server:alphadigi-heartbeat-service:heartbeat:${logId} no response body creator for command ${message.command}`
    );
    return defaultHeartbeatResponseBody;
  }

  const responseBody = responseBodyCreator(message.params);

  return responseBody;
}

function getAddWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} add whitelist response result=${requestBody.Response_AddWhiteList}`
  );

  return defaultHeartbeatResponseBody;
}

function getDeleteAllWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} delete all whitelist response result=${requestBody.Response_DelWhiteListAll}`
  );

  return defaultHeartbeatResponseBody;
}

function getDeleteWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} delete whitelist response result=${requestBody.Response_DeleteWhiteList.response}`
  );

  return defaultHeartbeatResponseBody;
}

function getAlarmInfoPlateResponse(requestBody: any): any {
  const { logId } = requestBody;

  const plateInfo = JSON.stringify(requestBody.AlarmInfoPlate);

  /**
   * {
  "AlarmInfoPlate": {
    "channel": 0,
    "deviceName": "ParkingCam",
    "ipaddr": "192.168.1.10",
    "result": {
      "PlateResult": {
        "bright": 0,
        "carBright": 0,
        "carColor": 0,
        "colorType": 3,
        "colorValue": 0,
        "confidence": 96,
        "direction": 1,
        "imagePath": "",
        "license": "OTM2022",
        "location": {
          "RECT": {
            "top": 904,
            "left": 556,
            "right": 1376,
            "bottom": 700
          }
        },
        "timeStamp": {
          "Timeval": {
            "sec": 1670976550,
            "usec": 0
          }
        },
        "timeUsed": 0,
        "triggerType": 2,
        "type": 1
      }
    },
    "serialno": "fd495d6ee960dbec"
  }
}
   */

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} plate info ${plateInfo}`
  );

  return defaultHeartbeatResponseBody;
}

async function getResponseBody(requestBody: any): Promise<any> {
  const { logId, ip } = requestBody;

  const equipamento = await equipamentoModel().findOne({
    attributes: ["id"],
    where: { ip },
  });

  if (!equipamento) {
    logger.warn(
      `http-server:alphadigi-heartbeat-service:heartbeat:${logId} device not found ip=${ip}`
    );
    return defaultHeartbeatResponseBody;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http-server:alphadigi-heartbeat-service:heartbeat:${logId} device ignoring events ip=${ip}`
    );
    return defaultHeartbeatResponseBody;
  }

  if (requestBody.heartbeat) {
    return getHeartbeatResponse(requestBody);
  }

  if (requestBody.AlarmInfoPlate) {
    return getAlarmInfoPlateResponse(requestBody);
  }

  if (requestBody.Response_AddWhiteList) {
    return getAddWhiteListResponse(requestBody);
  }

  if (requestBody.Response_DelWhiteListAll) {
    return getDeleteAllWhiteListResponse(requestBody);
  }

  if (requestBody.Response_DeleteWhiteList) {
    return getDeleteWhiteListResponse(requestBody);
  }

  logger.warn(
    `http-server:alphadigi-heartbeat-service:get-response-body:${logId} using default response body`
  );

  return defaultHeartbeatResponseBody;
}

export default {
  getResponseBody,
};

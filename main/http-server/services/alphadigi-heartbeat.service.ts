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

const responseBodyCreators: { [key: string]: ResponseBodyCreator } = {
  add_white_list: addWhiteListResponseBodyCreator,
  open_door: () => ({
    Response_Heartbeat: {
      info: "ok",
      shutoff: "no",
      snapnow: "no",
    },
  }),
  delete_all_white_list: () => ({
    deleteWhiteListAll: 1,
  }),
  delete_white_list: (plates: string[]) => ({
    deleteWhiteList: { del_data: plates.map((plate) => ({ carnum: plate })) },
  }),
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

  return responseBodyCreator(message.params);
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
    return defaultHeartbeatResponseBody;
  }

  if (requestBody.Response_AddWhiteList) {
    return defaultHeartbeatResponseBody;
  }

  if (requestBody.Response_DelWhiteListAll) {
    return defaultHeartbeatResponseBody;
  }

  if (requestBody.Response_DeleteWhiteList) {
    return defaultHeartbeatResponseBody;
  }

  logger.warn(
    `http-server:alphadigi-heartbeat-service:get-response-body:${logId} using default response body`
  );

  return defaultHeartbeatResponseBody;
}

export default {
  getResponseBody,
};

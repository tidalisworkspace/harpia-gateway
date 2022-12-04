import { format } from "date-fns";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import store from "../../store";

function toTimestamp(date: Date): number {
  return Number(format(date, "yyyyMMddHHmmss"));
}

function getStarTime(): number {
  return toTimestamp(new Date());
}

function getEndTime(): number {
  return 20371010162030;
}

const defaultResponseBody = {
  Response_Heartbeat: {
    info: "ok",
    shutoff: "no",
    snaphow: "no",
  },
};

function getHeartbeatResponse(requestBody: any): any {
  const { logId, ip } = requestBody;

  const whiteList = store.getWhiteList(ip);

  if (!whiteList.length) {
    return defaultResponseBody;
  }

  const startTime = getStarTime();
  const endTime = getEndTime();

  const data = whiteList.map((item) => ({
    carnum: item,
    starttime: startTime,
    endtime: endTime,
  }));

  const responseBody = {
    addWhiteList: {
      add_data: data,
    },
  };

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} creating whitelist with ${whiteList.length} values`
  );

  store.deleteWhiteList(ip);

  return responseBody;
}

function getAddWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} add whitelist response result=${requestBody.Response_AddWhiteList.response}`
  );

  return defaultResponseBody;
}

function getDeleteAllWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} delete all whitelist response result=${requestBody.Response_DelWhiteListAll.response}`
  );

  return defaultResponseBody;
}

function getDeleteWhiteListResponse(requestBody: any): any {
  const { logId } = requestBody;

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} delete whitelist response result=${requestBody.Response_DeleteWhiteList.response}`
  );

  return defaultResponseBody;
}

function getAlarmInfoPlateResponse(requestBody: any): any {
  const { logId } = requestBody;

  const plateInfo = JSON.stringify(requestBody.AlarmInfoPlate);

  logger.debug(
    `http-server:alphadigi-heartbeat-service:heartbeat:${logId} plate info ${plateInfo}`
  );

  return defaultResponseBody;
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
    return defaultResponseBody;
  }

  if (equipamento.ignorarEvento) {
    logger.warn(
      `http-server:alphadigi-heartbeat-service:heartbeat:${logId} device ignoring events ip=${ip}`
    );
    return defaultResponseBody;
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

  return defaultResponseBody;
}

export default {
  getResponseBody,
};

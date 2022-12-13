import { format, getUnixTime } from "date-fns";
import socketServer from "..";
import logger from "../../../shared/logger";
import { SetEventsServerParams } from "../../device-clients/types";
import store from "../../store";
import storage from "../connection-manager/storage";
import { HeaderWritter } from "./header-writter";
import {
  MessageHeader,
  MessageType,
  SocketCameraConnectionHandler
} from "./types";

let sequence = 0;
function getSequence() {
  sequence += 1;
  return sequence;
}

type RequestBodyCreator = (params?: any) => string;

function getTimestamp(): string {
  return format(new Date(), "yyyy-MM-dd HH:mm:ss");
}

const requestBodyCreators: { [key: string]: RequestBodyCreator } = {
  open_door: () => JSON.stringify({ message: "open_door" }),
  reboot: () => JSON.stringify({ message: "restart" }),
  update_time: () =>
    JSON.stringify({
      message: "config_system",
      data: {
        time_sync: {
          ntp_enable: 0,
          system_time: getTimestamp(),
          ntp_server_address: "",
          ntp_server_port: 0,
          time_zone: -3,
        },
      },
    }),
  configure_events_server: (params: SetEventsServerParams) =>
    JSON.stringify({
      message: "config_system",
      data: {
        httppush: {
          pushenable: "5",
          webaddr: params.ip,
          viceaddr: "",
          port: params.port.toString(),
          timeout: "5",
          planeenable: "1",
          platepushaddr: "/alphadigi/plate",
          bigpic: "0",
          smallpic: "0",
          gpioenable: "0",
          gpiopushaddr: "",
          serialenable: "0",
          serialpushadd: "",
          charcode: "0",
          heartenable: "1",
          heartpushaddr: "/alphadigi/heartbeart",
          heartinterval: "10",
          privatemode: "0",
          sslenable: "0",
          sslport: "443",
          authtype: "0",
        },
      },
    }),
};

export class HeartbeatHandler implements SocketCameraConnectionHandler {
  name = "heartbeat";
  messageType = MessageType.HEARTBEAT;
  headerWritter: HeaderWritter;

  constructor(headerWritter: HeaderWritter) {
    this.headerWritter = headerWritter;
  }

  async handle(connectionId: string, header: MessageHeader): Promise<void> {
    const { connection } = storage.get(connectionId);
    const ip = connection.remoteAddress;

    if (!ip) {
      logger.warn(
        `socket:camera-handler:${this.name}:${connectionId} impossible to proceed without ip`
      );
    }

    const cameraQueueMessage = store.getFirstCameraQueueMessage(ip);

    if (!cameraQueueMessage) {
      return;
    }

    logger.info(
      `socket:camera-handler:${this.name}:${connectionId} executing ${cameraQueueMessage.command} command`
    );

    const requestBodyCreator = requestBodyCreators[cameraQueueMessage.command];

    if (!requestBodyCreator) {
      logger.warn(
        `socket:camera-handler:${this.name}:${connectionId} no request body creator found for ${cameraQueueMessage.command} command`
      );
    }

    const requestBody = requestBodyCreator(cameraQueueMessage.params);

    const requestHeader = Object.assign(header, {
      version: 2,
      msgtype: MessageType.REQUEST,
      datatype: 0,
      resv: "",
      timestamp: getUnixTime(new Date()),
      seq: getSequence(),
      datasize: requestBody.length,
    } as MessageHeader);

    const headerBuffer = this.headerWritter.write(requestHeader);

    socketServer.sendToCamera(connectionId, headerBuffer, requestBody);
  }
}

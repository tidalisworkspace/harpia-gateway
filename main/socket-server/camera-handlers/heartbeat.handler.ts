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
  SocketCameraConnectionHandler,
} from "./types";

let sequence = 0;
function getSequence() {
  sequence += 1;
  return sequence;
}

type RequestBodyCreator = (params?: any) => any;

function getTimestamp(): string {
  return format(new Date(), "yyyy-MM-dd HH:mm:ss");
}

const requestBodyCreators: { [key: string]: RequestBodyCreator } = {
  reboot: () => ({ message: "restart" }),
  update_time: () => ({
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
  configure_events_server: (params: SetEventsServerParams) => ({
    message: "config_system",
    data: {
      http_push_setup: {
        enable: 1,
        ip_address: params.ip,
        port: params.port,
        plate_address: "/alphadigi/push",
        backup_ip_address: "",
        palate_enable: 1,
        big_picture_enable: 0,
        small_picture_enable: 0,
        character_encoding: 1,
        timeout: 30,
        ssl_enable: 0,
        private_protocol: 0,
        verify_way: 0,
        ssl_port: 443,
        gpio_push_enable: 0,
        gpio_address: "",
        serial_push_enable: 0,
        serial_address: "",
        heartbeat_enable: 1,
        heartbeat_address: "/alphadigi/heartbeat",
        heartbeat_interval: 3,
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

    const message = store.getFirstCameraQueueSocket(ip);

    if (!message) {
      return;
    }

    logger.info(
      `socket:camera-handler:${this.name}:${connectionId} executing ${message.command} command`
    );

    const requestBodyCreator = requestBodyCreators[message.command];

    if (!requestBodyCreator) {
      logger.warn(
        `socket:camera-handler:${this.name}:${connectionId} no request body creator found for ${message.command} command`
      );
    }

    const requestBody = requestBodyCreator(message.params);
    const requestBodyString = JSON.stringify(requestBody);

    const requestHeader = Object.assign(header, {
      version: 2,
      msgtype: MessageType.REQUEST,
      datatype: 1,
      timestamp: getUnixTime(new Date()),
      seq: getSequence(),
      datasize: requestBodyString.length,
    } as MessageHeader);

    const headerBuffer = this.headerWritter.write(requestHeader);

    socketServer.sendToCamera(connectionId, headerBuffer, requestBodyString);
  }
}

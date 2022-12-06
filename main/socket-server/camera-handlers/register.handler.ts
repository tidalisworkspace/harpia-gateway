import { throws } from "assert";
import { getUnixTime } from "date-fns";
import socketServer from "..";
import { HeaderWritter } from "./header-writter";
import {
  MessageHeader,
  MessageType,
  SocketCameraConnectionHandler,
} from "./types";

export class RegisterHandler implements SocketCameraConnectionHandler {
  name = "register";
  messageType = MessageType.REQUEST;
  headerWritter: HeaderWritter;

  constructor(headerWritter: HeaderWritter) {
    this.headerWritter = headerWritter;
  }

  async handle(connectionId: string, header: MessageHeader): Promise<void> {
    const responseBody = JSON.stringify({
      message: "register",
      result: 0,
      desc: "",
      data: {
        uuid: "667cd2f0a8464391ba95422b318b4172",
        passwd: "gtp61s+jDIVZdDc/",
      },
    });

    const responseHeader = Object.assign(header, {
      version: 2,
      datasize: responseBody.length,
      msgtype: 4,
      timestamp: getUnixTime(new Date()),
    } as MessageHeader);

    const headerBuffer = this.headerWritter.write(responseHeader);

    socketServer.sendToCamera(connectionId, headerBuffer, responseBody);
  }
}

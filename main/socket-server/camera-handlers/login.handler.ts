import { throws } from "assert";
import { getUnixTime } from "date-fns";
import socketServer from "..";
import { HeaderWritter } from "./header-writter";
import {
  MessageHeader,
  MessageType,
  SocketCameraConnectionHandler,
} from "./types";

export class LoginHandler implements SocketCameraConnectionHandler {
  name = "login";
  messageType = MessageType.REQUEST;
  headerWritter: HeaderWritter;

  constructor(headerWritter: HeaderWritter) {
    this.headerWritter = headerWritter;
  }

  async handle(connectionId: string, header: MessageHeader): Promise<void> {
    const responseBody = JSON.stringify({
      message: "login",
      result: 0,
      desc: "",
      data: null,
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

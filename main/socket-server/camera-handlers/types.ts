export enum MessageType {
  HEARTBEAT = 1,
  NOTIFICATION = 2,
  REQUEST = 3,
  RESPONSE = 4,
}

export interface MessageHeader {
  magic: string;
  version: number;
  msgtype: number;
  datatype: number;
  resv: string;
  timestamp: number;
  seq: number;
  datasize: number;
}

export enum HeaderValueType {
  NUMBER = "number",
  TEXT = "text",
}

export interface HeaderValueDefinition {
  name: string;
  size: number;
  start: number;
  end: number;
  type: HeaderValueType;
}

export interface HeaderValueWritter {
  type: HeaderValueType;
  write: (header: MessageHeader, definition: HeaderValueDefinition) => Buffer;
}

export interface HeaderValueReader {
  type: HeaderValueType;
  read: (data: Buffer, definition: HeaderValueDefinition) => number | string;
}

export const headerMagic = "QYZN";

export const headerSize = 20;

export interface SocketCameraConnectionHandler {
  readonly name: string;
  readonly messageType: MessageType;
  handle(connectionId: string, header: MessageHeader): Promise<void>;
}

export interface CameraQueueMessage {
  messageType: MessageType;
  body: any;
}

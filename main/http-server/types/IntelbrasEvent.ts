export interface EventData {
  CardNo: string;
  UserID: string;
  ErrorCode: number;
}

export type EventCode = "AccessControl" | "DoorStatus";

export interface EventInfo {
  Code: EventCode;
  Data: EventData;
  Index: number;
}

export default interface IntelbrasEvent {
  logId: string;
  ip: string;
  Time: string;
  Events: EventInfo[];
}

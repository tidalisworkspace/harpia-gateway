export interface EventData {
  CardNo: string;
  UserID: string;
}

export type EventCode = "AccessControl" | "DoorStatus";

export interface EventInfo {
  Code: EventCode;
  Data: EventData;
  Index: number;
}

export default interface IntelbrasEvent {
  ip: string;
  Time: string;
  Events: EventInfo[];
}

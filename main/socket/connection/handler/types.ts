import { StringGradients } from "antd/lib/progress/progress";

export interface DataHandler {
  getName(): string;
  handle(connectionId: string, request: Request): Promise<void>;
}

export interface Request {
  functionName: string;
  payload: unknown;
}

export interface TriggerRelayPayload {
  ip: string;
  port: number;
  client: string;
}

export interface TriggerRelayRequest extends Request {
  payload: TriggerRelayPayload;
}

export interface CaptureFacePayload {
  ip: string;
  port: number;
  client: string;
  peopleId: string;
  faceDirectory: string;
}

export interface CaptureFaceRequest extends Request {
  payload: CaptureFacePayload;
}

export interface Device {
  ip: string;
  port: number;
  rightPlans?: any[];
}

export interface People {
  id: string;
  name: string;
  cards: string[];
  devices: Device[];
  expiration: TimeRange;
  photo: string;
}

export interface RecordPeoplesPayload {
  client: string;
  peoples: People[];
  faceDirectory: string;
}

export interface RecordPeoplesRequest extends Request {
  payload: RecordPeoplesPayload;
}

export interface TimeRange {
  beginTime: string;
  endTime: string;
}

export interface RightPlan {
  id: string;
  name: string;
  devices: Device[];
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

export interface UserRightPayload {
  client: string;
  rightPlans: RightPlan[];
}

export interface UserRightRequest extends Request {
  payload: UserRightPayload;
}

export interface People {
  id: string;
  devices: Device[];
}

export interface DeleteUserPayload {
  client: string;
  peoples: People[];
}

export interface DeleteUserRequest extends Request {
  payload: DeleteUserPayload;
}

export interface DeleteUserRightPayload {
  client: string
  devices: Device[];
}

export interface DeleteUserRightRequest extends Request {
  payload: DeleteUserRightPayload;
}

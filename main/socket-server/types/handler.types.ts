export interface SocketConnectionHandler {
  readonly name: string;
  handle(connectionId: string, request: Request): Promise<void>;
}

export interface Payload {
  client: string;
}

export interface Request {
  functionName: string;
  payload: Payload;
}

export interface TriggerRelayPayload extends Payload {
  ip: string;
  port: number;
}

export interface TriggerRelayRequest extends Request {
  payload: TriggerRelayPayload;
}

export interface CaptureFacePayload extends Payload {
  ip: string;
  port: number;
  peopleId: string;
  faceDirectory: string;
}

export interface CaptureFaceRequest extends Request {
  payload: CaptureFacePayload;
}

export interface Device {
  ip: string;
  port: number;
  rightPlans?: number[];
  plates?: string[];
}

export interface People {
  id: string;
  name: string;
  cards: string[];
  devices: Device[];
  expiration: TimeRange;
  photo: string;
  role?: string;
  password?: string;
}

export interface RecordPeoplesPayload extends Payload {
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

export interface UserRightPayload extends Payload {
  rightPlans: RightPlan[];
}

export interface UserRightRequest extends Request {
  payload: UserRightPayload;
}

export interface PeopleToDelete {
  id: string;
  devices: Device[];
}

export interface DeleteUserPayload extends Payload {
  peoples: PeopleToDelete[];
}

export interface DeleteUserRequest extends Request {
  payload: DeleteUserPayload;
}

export interface DeleteUserRightPayload extends Payload {
  devices: Device[];
}

export interface DeleteUserRightRequest extends Request {
  payload: DeleteUserRightPayload;
}

export interface RebootPayload extends Payload {
  devices: Device[];
}

export interface RebootRequest extends Request {
  payload: RebootPayload;
}

export interface DeleteAllUserPayload extends Payload {
  devices: Device[];
}

export interface DeleteAllUserRequest extends Request {
  payload: DeleteAllUserPayload;
}

export interface SaveWhiteListPayload extends Payload {
  devices: Device[]
}

export interface SaveWhiteListRequest extends Request {
  payload: SaveWhiteListPayload;
}

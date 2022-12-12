import { TimeRange } from "../socket-server/types/handler.types";

export type Manufacturer = "<HIKV>" | "<ITBF>" | "<CIBM>" | "<LPRA>";

export interface DeviceClient<R> {
  getManufacturer(): Manufacturer;
  init(ip: string, port: number): Promise<DeviceClient<unknown>>;
  openDoor(): Promise<R>;
  updateTime(): Promise<R>;
  captureFace(): Promise<string>;
  saveFace(params: SaveFaceParams): Promise<R>;
  deleteFaces(params: DeleteFacesParams): Promise<R>;
  saveCard(params: SaveCardParams): Promise<R>;
  deleteCards(params: DeleteCardsParams): Promise<R>;
  saveUser(params: SaveUserParams): Promise<R>;
  deleteUsers(params: DeleteUsersParams): Promise<R>;
  deleteAllUsers(): Promise<R>;
  saveUserRight(params: SaveUserRightParams): Promise<R>;
  deleteAllUserRight(): Promise<void>;
  reboot(): Promise<R>;
  setEventsServer(params: SetEventsServerParams): Promise<void>;
  testConnection(): Promise<string>;
  getEvents(): Promise<any[]>;
  deleteEvents(params: DeleteEventsParams): Promise<void>;
}

export interface Boundary {
  getManufacturer(): Manufacturer;
  getToken(): string;
}

export interface SaveFaceParams {
  id: string;
  picture: string;
}

export interface DeleteFacesParams {
  ids: number[];
}

export interface SaveCardParams {
  id: string;
  number: string;
}

export interface DeleteCardsParams {
  ids: number[];
}

export interface UserCredentials {
  password: string;
  salt: string;
}

export interface SaveUserParams {
  id: string;
  name: string;
  rightPlans?: number[];
  expiration?: TimeRange;
  role?: string;
  password?: string;
}

export interface DeleteUsersParams {
  ids: string[];
}

export interface SaveUserRightParams {
  id: string;
  name?: string;
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
}

export interface SetEventsServerParams {
  ip: string;
  port: number;
}

export interface DeleteEventsParams {
  ids: string[];
}

export class FunctionNotImplementedError extends Error {
  constructor() {
    super("function not implemented")
  }
}

import { TimeRange } from "../socket/connection/handler/types";

export type Manufacturer = "<HIKV>" | "<ITBF>";

export interface DeviceClient {
  getManufacturer(): Manufacturer;
  init(ip: string, port: number): Promise<DeviceClient>;
  openDoor(): Promise<Response>;
  updateTime(): Promise<Response>;
  captureFace(): Promise<string>;
  saveFace(params: SaveFaceParams): Promise<Response>;
  deleteFaces(params: DeleteFacesParams): Promise<Response>;
  saveCard(params: SaveCardParams): Promise<Response>;
  deleteCards(params: DeleteCardsParams): Promise<Response>;
  saveUser(params: SaveUserParams): Promise<Response>;
  deleteUsers(params: DeleteUsersParams): Promise<Response>;
  saveUserRight(params: SaveUserRightParams): Promise<Response>;
  deleteAllUserRight(): Promise<void>;
  reboot(): Promise<Response>;
  setEventsServer(params: SetEventsServerParams): Promise<void>;
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

export interface SaveUserParams {
  id: string;
  name: string;
  rightPlans?: number[];
  expiration?: TimeRange;
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

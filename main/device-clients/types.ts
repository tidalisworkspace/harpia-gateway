export type Manufacturer = "<HIKV>" | "<ITBF>";

export interface DeviceClient {
  getManufacturer(): Manufacturer;
  init(ip: string, port: number): Promise<DeviceClient>;
  openDoor(): Promise<Response>;
  setTimeZone(): Promise<Response>;
  setTime(): Promise<Response>;
  captureFace(): Promise<Response>;
  saveFace(params: any): Promise<Response>;
  deleteFaces(params: any): Promise<Response>;
  saveCard(params: any): Promise<Response>;
  deleteCards(params: any): Promise<Response>;
  saveUser(params: any): Promise<Response>;
  deleteUsers(params: any): Promise<Response>;
  saveUserRight(params: any): Promise<Response>;
  deleteUserRight(params: any): Promise<Response>;
  reboot(): Promise<Response>;
}

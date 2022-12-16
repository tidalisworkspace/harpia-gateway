import axios, { Axios, AxiosRequestConfig, AxiosResponse } from "axios";
import ping from "ping";
import logger from "../../shared/logger";
import {
  CameraCommand,
  CameraQueueMessage,
} from "../socket-server/camera-handlers/types";
import store from "../store";
import {
  DeleteCardsParams,
  DeleteEventsParams,
  DeleteFacesParams,
  DeleteUsersParams,
  DeviceClient,
  FunctionNotImplementedError,
  Manufacturer,
  SaveCardParams,
  SaveFaceParams,
  SaveUserParams,
  SaveUserRightParams,
  SetEventsServerParams,
} from "./types";

export class AlphadigiClient implements DeviceClient<void> {
  private ip: string;
  private host: string;
  private httpClient: Axios;

  getManufacturer(): Manufacturer {
    return "<LPRA>";
  }

  async init(ip: string, port: number): Promise<DeviceClient<void>> {
    this.ip = ip;
    this.host = `${ip}:${port}`;

    try {
      this.httpClient = axios.create({
        baseURL: `http://${this.host}`,
        validateStatus: null,
      });

      return this;
    } catch (e) {
      logger.error(`alphadigi-client:${this.host} ${e.name}:${e.message}`);

      return null;
    }
  }

  private isOk(response: AxiosResponse) {
    return response.status >= 200 && response.status <= 299;
  }

  private async fetchAndLog(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const response = await this.httpClient.request(config);

    if (!this.isOk(response)) {
      const details = JSON.stringify({
        request: {
          method: config.method,
          url: config.url,
          body: config.data,
        },
        response: {
          status: `${response.status} ${response.statusText}`,
          body: response.data,
        },
      });

      logger.warn(`alphadigi-client:${this.host} response not ok ${details}`);
    }

    return response;
  }

  openDoor(): Promise<void> {
    const message: CameraQueueMessage = {
      command: CameraCommand.OPEN_DOOR,
    };

    store.addCameraQueueSocket(this.ip, message);

    return;
  }

  updateTime(): Promise<void> {
    const message: CameraQueueMessage = {
      command: CameraCommand.UPDATE_TIME,
    };

    store.addCameraQueueSocket(this.ip, message);

    return;
  }

  async captureFace(): Promise<string> {
    throw new FunctionNotImplementedError();
  }

  async saveFace(params: SaveFaceParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  deleteFaces(params: DeleteFacesParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  saveCard(params: SaveCardParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  deleteCards(params: DeleteCardsParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  async saveUser(params: SaveUserParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  deleteUsers(params: DeleteUsersParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  deleteAllUsers(): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  async saveUserRight(params: SaveUserRightParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  async deleteAllUserRight(): Promise<void> {
    throw new FunctionNotImplementedError();
  }

  reboot(): Promise<any> {
    const message: CameraQueueMessage = {
      command: CameraCommand.REBOOT,
    };

    store.addCameraQueueSocket(this.ip, message);

    return;
  }

  async setEventsServer(params: SetEventsServerParams): Promise<void> {
    const message: CameraQueueMessage = {
      command: CameraCommand.CONFIGURE_EVENTS_SERVER,
      params,
    };

    store.addCameraQueueSocket(this.ip, message);

    return;
  }

  async testConnection(): Promise<string> {
    const { alive } = await ping.promise.probe(this.ip);

    if (!alive) {
      return "ping_failed";
    }

    const response = await this.fetchAndLog({ method: "get", url: "/" });

    if (!this.isOk(response)) {
      return "response_not_ok";
    }

    return "connected";
  }

  async getEvents(): Promise<any[]> {
    throw new FunctionNotImplementedError();
  }

  async deleteEvents(params: DeleteEventsParams): Promise<void> {
    throw new FunctionNotImplementedError();
  }
}

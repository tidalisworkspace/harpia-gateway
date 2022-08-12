import { format } from "date-fns";
import DigestFetch from "digest-fetch";
import parametroModel from "../database/models/parametro.model";
import logger from "../../shared/logger";
import { DeviceClient, Manufacturer } from "./types";

export class IntelbrasClient implements DeviceClient {
  private host: string;
  private httpClient: DigestFetch;

  getManufacturer(): Manufacturer {
    return "<ITBF>";
  }

  async init(ip: string, port: number): Promise<DeviceClient> {
    this.host = `${ip}:${port}`;

    try {
      const parametro = await parametroModel().findOne();
      const username = parametro?.usuarioIntelbras || "admin";
      const password = parametro?.senhaIntelbras || "admin123";
      this.httpClient = new DigestFetch(username, password);
    } catch (e) {
      logger.error(`Device client [${this.getManufacturer()}] error ${e.message}`);
      this.httpClient = new DigestFetch("admin", "admin123");
    }

    return this;
  }

  openDoor(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/accessControl.cgi?action=openDoor&channel=1&Type=Remote`
    );
  }

  setTimeZone(): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  setTime(): Promise<Response> {
    const time = format(new Date(), "yyyy-mm-dd HH:mm:ss");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/global.cgi?action=setCurrentTime&time=${time}`
    );
  }

  captureFace(): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  saveFace(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  deleteFaces(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  saveCard(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  deleteCards(params: { ids: string[] }): Promise<Response> {
    const { ids } = params;

    const cardNumberParam = ids
      .map((id, index) => `CardNoList[${index}]=${id}`)
      .join("&");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessCard.cgi?action=removeMulti&${cardNumberParam}`
    );
  }

  saveUser(params: {
    id: string;
    name: string;
    expiration: { beginTime: string; endTime: string };
  }): Promise<Response> {
    const { id, name, expiration } = params;

    let { beginTime, endTime } = expiration || { beginTime: "", endTime: "" };
    beginTime = beginTime.replace("T", " ");
    beginTime = beginTime.replace(/[-:]/g, "");

    endTime = endTime.replace("T", " ");
    endTime = endTime.replace(/[-:]/g, "");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/recordUpdater.cgi?action=insert&name=${name}&CardNo=0&CardStatus=0&CardName=${name}&UserID=${id}&Doors[0]=0&Password=&ValidDateStart=${beginTime}&ValidDateEnd=${endTime}`
    );
  }

  deleteUsers(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  saveUserRight(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  deleteUserRight(params: any): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  reboot(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/magicBox.cgi?action=reboot`
    );
  }
}

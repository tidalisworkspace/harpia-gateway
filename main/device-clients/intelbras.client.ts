import { format } from "date-fns";
import DigestFetch from "digest-fetch";
import streams from "memory-streams";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import responseUtil from "./ResponseUtil";
import { DeleteCardsParams, DeleteFacesParams, DeleteUsersParams, DeviceClient, Manufacturer, SaveCardParams, SaveFaceParams, SaveUserParams, SaveUserRightParams } from "./types";
import fs from "fs";

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
      logger.error(
        `Device client [${this.getManufacturer()}] error ${e.message}`
      );
      this.httpClient = new DigestFetch("admin", "admin123");
    }

    return this;
  }

  openDoor(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/accessControl.cgi?action=openDoor&channel=1&Type=Remote`
    );
  }

  setTime(): Promise<Response> {
    const time = format(new Date(), "yyyy-mm-dd HH:mm:ss");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/global.cgi?action=setCurrentTime&time=${time}`
    );
  }

  async captureFace(): Promise<string> {
    await this.httpClient.fetch(
      `http://${this.host}/cgi-bin/accessControl.cgi?action=captureCmd&type=1&heartbeat=5&timeout=10`
    );

    const request = new Promise<Buffer>(async (resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new Error("capture face timeout")),
        10 * 1000
      );

      const response = await this.httpClient.fetch(
        `http://${this.host}/cgi-bin/snapManager.cgi?action=attachFileProc&Flags[0]=Event&Events=[CitizenPictureCompare]`
      );

      const bodyStream = new streams.WritableStream();

      const body = await response.body;
      body.pipe(bodyStream);

      setTimeout(() => {
        clearTimeout(timeoutId);

        const bodyBuffer = bodyStream.toBuffer();

        resolve(bodyBuffer);
      }, 3 * 1000);
    });

    const body = await request;
    logger.info("response body length:", body.length);
    const faceBuffer = responseUtil.getContent(body, "<ITBF>");

    return faceBuffer.toString("base64");
  }

  saveFace(params: SaveFaceParams): Promise<Response> {
    const { id, picture } = params;

    const faceBuffer = fs.readFileSync(picture);
    const faceBase64 = faceBuffer.toString("base64");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessFace.cgi?action=insertMulti`,
      {
        method: "post",
        body: {
          FaceList: [
            {
              UserID: id,
              PhotoData: [faceBase64],
            },
          ],
        },
      }
    );
  }

  deleteFaces(params: DeleteFacesParams): Promise<Response> {
    const { ids } = params;

    const userIdParam = ids
      .map((id, index) => `UserID[${index}]=${id}`)
      .join("&");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/FaceInfoManager.cgi?action=remove&${userIdParam}`
    );
  }

  saveCard(params: SaveCardParams): Promise<Response> {
    const { id, number } = params;

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessCard.cgi?action=insertMulti`,
      {
        method: "post",
        body: {
          CardList: [
            {
              UserID: id,
              CardNo: number,
              CardType: 0,
              CardStatus: 0,
            },
          ],
        },
      }
    );
  }

  deleteCards(params: DeleteCardsParams): Promise<Response> {
    const { ids } = params;

    const cardNumberParam = ids
      .map((id, index) => `CardNoList[${index}]=${id}`)
      .join("&");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessCard.cgi?action=removeMulti&${cardNumberParam}`
    );
  }

  saveUser(params: SaveUserParams): Promise<Response> {
    const { id, name, rightPlans, expiration } = params;

    let { beginTime, endTime } = expiration || { beginTime: "", endTime: "" };
    beginTime = beginTime.replace("T", " ");
    endTime = endTime.replace("T", " ");

    const sections = rightPlans || [0];

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessUser.cgi?action=insertMulti`,
      {
        method: "post",
        body: {
          UserList: [
            {
              UserID: id,
              UserName: name,
              TimeSections: sections,
              ValidFrom: beginTime,
              ValidTo: endTime,
            },
          ],
        },
      }
    );
  }

  deleteUsers(params: DeleteUsersParams): Promise<Response> {
    const { ids } = params;

    const userIdParam = ids
      .map((id, index) => `UserIDList[${index}]=${id}`)
      .join("&");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessUser.cgi?action=removeMulti&${userIdParam}`
    );
  }

  saveUserRight(params: SaveUserRightParams): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  deleteAllUserRight(): Promise<Response> {
    throw new Error("Method not implemented.");
  }

  reboot(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/magicBox.cgi?action=reboot`
    );
  }
}

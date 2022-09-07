import { format } from "date-fns";
import DigestFetch from "digest-fetch";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import responseUtil from "./ResponseUtil";
import {
  DeleteCardsParams,
  DeleteFacesParams,
  DeleteUsersParams,
  DeviceClient,
  Manufacturer,
  SaveCardParams,
  SaveFaceParams,
  SaveUserParams,
  SaveUserRightParams,
} from "./types";
import fs from "fs";
import { TimeRange } from "../socket/connection/handler/types";
import range from "../helpers/range";
import tmp, { FileResult } from "tmp";

export class IntelbrasClient implements DeviceClient {
  private host: string;
  private httpClient: DigestFetch;
  private days: string[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  private defaultTimeRange: TimeRange = {
    beginTime: "00:00:00",
    endTime: "00:00:00",
  };

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

    const request = new Promise<FileResult>(async (resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new Error("capture face timeout")),
        60 * 1000
      );

      const response = await this.httpClient.fetch(
        `http://${this.host}/cgi-bin/snapManager.cgi?action=attachFileProc&Flags[0]=Event&Events=[CitizenPictureCompare]`
      );

      const tempFile = tmp.fileSync();

      const writeStream = fs.createWriteStream(tempFile.name);

      const body = await response.body;
      body.pipe(writeStream);

      clearTimeout(timeoutId);

      setTimeout(() => {
        resolve(tempFile);
      }, 5 * 1000);
    });

    const responseTempFile = await request;
    const body = fs.readFileSync(responseTempFile.name);
    const faceBuffer = responseUtil.getContent(body, "<ITBF>");

    return faceBuffer.toString("base64");
  }

  saveFace(params: SaveFaceParams): Promise<Response> {
    const { id, picture } = params;

    const faceBuffer = fs.readFileSync(picture);
    const faceBase64 = faceBuffer.toString("base64");

    const body = {
      FaceList: [
        {
          UserID: id,
          PhotoData: [faceBase64],
        },
      ],
    };

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessFace.cgi?action=insertMulti`,
      {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

    const body = {
      CardList: [
        {
          UserID: id,
          CardNo: Number(number).toString(16),
          CardType: 0,
          CardStatus: 0,
        },
      ],
    };

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessCard.cgi?action=insertMulti`,
      {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

    const timeSections = rightPlans || [0];

    const body = {
      UserList: [
        {
          UserID: id,
          UserName: name,
          Doors: [0],
          TimeSections: timeSections,
          ValidFrom: beginTime,
          ValidTo: endTime,
        },
      ],
    };

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessUser.cgi?action=insertMulti`,
      {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  }

  deleteUsers(params: DeleteUsersParams): Promise<Response> {
    const { ids } = params;

    if (ids && ids.length) {
      const userIdParam = ids
        .map((id, index) => `UserIDList[${index}]=${id}`)
        .join("&");

      return this.httpClient.fetch(
        `http://${this.host}/cgi-bin/AccessUser.cgi?action=removeMulti&${userIdParam}`
      );
    }

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/AccessUser.cgi?action=removeAll`
    );
  }

  saveUserRight(params: SaveUserRightParams): Promise<Response> {
    const { id } = params;

    const userRights = this.days.reduce((accumulator, current, index) => {
      const { beginTime, endTime } = params[current] || this.defaultTimeRange;

      accumulator.push(
        `AccessTimeSchedule[${id}].TimeSchedule[${index}][0]=1 ${beginTime}-${endTime}`
      );

      const { beginTime: beginTimeDefault, endTime: endTimeDefault } =
        this.defaultTimeRange;

      range(3, 1).forEach((i) => {
        accumulator.push(
          `AccessTimeSchedule[${id}].TimeSchedule[${index}][${i}]=1 ${beginTimeDefault}-${endTimeDefault}`
        );
      });

      return accumulator;
    }, []);

    const userRightsParam = userRights.join("&");

    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/configManager.cgi?action=setConfig&AccessTimeSchedule[${id}].Enable=true&${userRightsParam}`
    );
  }

  deleteAllUserRight(): Promise<void> {
    return new Promise(async (resolve) => {
      for (const id of range(33)) {
        const configParam = range(7)
          .map(
            (i) =>
              `AccessTimeSchedule[${id}].TimeSchedule[${i}][0]=1 00:00:00-00:00:00`
          )
          .join("&");

        await new Promise((resolve) => setTimeout(resolve, 150));

        const response = await this.httpClient.fetch(
          `http://${this.host}/cgi-bin/configManager.cgi?action=setConfig&${configParam}`
        );

        logger.debug(
          "deleteAllUserRight:",
          id,
          response.status,
          response.statusText
        );
      }

      resolve();
    });
  }

  reboot(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/cgi-bin/magicBox.cgi?action=reboot`
    );
  }
}

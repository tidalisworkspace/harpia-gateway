import { formatISO } from "date-fns";
import DigestFetch from "digest-fetch";
import fs from "fs";
import parametroModel from "../database/models/parametro.model";
import logger from "../../shared/logger";
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
import responseReader from "../helpers/response-reader";
import { TimeRange } from "../socket/connection/handler/types";
import range from "../helpers/range";

export class HikvisionClient implements DeviceClient {
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
    return "<HIKV>";
  }

  async init(ip: string, port: number): Promise<DeviceClient> {
    this.host = `${ip}:${port}`;

    try {
      const parametro = await parametroModel().findOne();
      const username = parametro?.usuarioHikvision || "admin";
      const password = parametro?.senhaHikvision || "admin";
      
      this.httpClient = new DigestFetch(username, password);

      logger.info(`hikvisionClient:init:${this.host} initilized`);
    } catch (e) {
      logger.error(`hikvisionClient:init:${this.host} error ${e.name}:${e.message}`);

      this.httpClient = new DigestFetch("admin", "admin");
    }

    return this;
  }

  saveCard(params: SaveCardParams): Promise<Response> {
    const { id, number } = params;

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/CardInfo/SetUp?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          CardInfo: {
            employeeNo: id.toString(),
            cardNo: number,
            cardType: "normalCard",
          },
        }),
      }
    );
  }

  deleteCards(params: DeleteCardsParams): Promise<Response> {
    const { ids } = params;

    const list = ids.map((id) => {
      return {
        employeeNo: id.toString(),
      };
    });

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/CardInfo/Delete?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          CardInfoDelCond: {
            EmployeeNoList: list,
          },
        }),
      }
    );
  }

  async captureFace(): Promise<string> {
    const response = await this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/CaptureFaceData`,
      {
        method: "post",
        body: '<CaptureFaceDataCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><captureInfrared>false</captureInfrared><dataType>binary</dataType></CaptureFaceDataCond>',
      }
    );

    const body = await response.buffer();
    const faceBuffer = responseReader.getFace(body, "<HIKV>");

    return faceBuffer.toString("base64");
  }

  saveFace(params: SaveFaceParams): Promise<Response> {
    const { id, picture } = params;

    const boundary = `--------------- ${new Date().getTime()}`;
    const content = JSON.stringify({
      faceLibType: "blackFD",
      FDID: "1",
      FPID: id.toString(),
    });

    const bytes1 = Buffer.from(`--${boundary}\r\n`, "utf8");
    const bytes2 = Buffer.from(
      `Content-Disposition: form-data; name="FaceDataRecord";\r\nContent-Type: application/json\r\nContent-Length: ${content.length}\r\n\r\n`,
      "utf8"
    );
    const bytes3 = Buffer.from(content, "utf8");
    const bytes5 = fs.readFileSync(picture);
    const bytes4 = Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="FaceImage";\r\nContent-Type: image/jpeg\r\nContent-Length: ${bytes5.length}\r\n\r\n`,
      "utf8"
    );
    const bytes6 = Buffer.from("\r\n", "utf8");
    const bytes7 = Buffer.from(`--${boundary}--\r\n`, "utf8");

    const stream = Buffer.concat([
      bytes1,
      bytes2,
      bytes3,
      bytes4,
      bytes5,
      bytes6,
      bytes7,
    ]);

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`,
      {
        method: "post",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": stream.length,
        },
        body: stream,
      }
    );
  }

  deleteFaces(params: DeleteFacesParams): Promise<Response> {
    const { ids } = params;

    const list = ids.map((id) => {
      return {
        value: id.toString(),
      };
    });

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&FDID=1&faceLibType=blackFD`,
      {
        method: "put",
        body: JSON.stringify({
          FPID: list,
        }),
      }
    );
  }

  openDoor(): Promise<Response> {
    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/RemoteControl/door/1`,
      {
        method: "put",
        body: '<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><cmd>open</cmd></RemoteControlDoor>',
      }
    );
  }

  async setTime(): Promise<Response> {
    await this.httpClient.fetch(
      `http://${this.host}/ISAPI/System/time/timeZone`,
      {
        method: "put",
        body: "GMT+3",
      }
    );

    const datetime = formatISO(new Date());

    return this.httpClient.fetch(`http://${this.host}/ISAPI/System/time`, {
      method: "put",
      body: `<Time version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><timeMode>manual</timeMode><localTime>${datetime}</localTime><timeZone>GMT+3</timeZone></Time>`,
    });
  }

  saveUser(params: SaveUserParams): Promise<Response> {
    const { id, name, rightPlans, expiration } = params;

    const RightPlan = (rightPlans || [1]).map((rightPlan) => ({
      planTemplateNo: rightPlan.toString(),
    }));

    const Valid = expiration
      ? { enable: true, ...expiration }
      : { enable: false };

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/UserInfo/SetUp?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          UserInfo: {
            employeeNo: id.toString(),
            name,
            userType: "normal",
            Valid,
            doorRight: "1",
            RightPlan,
          },
        }),
      }
    );
  }

  deleteUsers(params: DeleteUsersParams): Promise<Response> {
    const { ids } = params;

    const UserInfoDetail =
      ids && ids.length
        ? {
            mode: "byEmployeeNo",
            EmployeeNoList: ids.map((id) => ({ employeeNo: id.toString() })),
          }
        : { mode: "all" };

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/UserInfoDetail/Delete?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          UserInfoDetail,
        }),
      }
    );
  }

  private capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private toPlanConfig(id, day, rightPlan) {
    if (!rightPlan) {
      return {
        id,
        week: this.capitalize(day),
        ...this.defaultTimeRange,
      };
    }

    const { beginTime, endTime } = rightPlan[day] || this.defaultTimeRange;

    return {
      id,
      week: this.capitalize(day),
      beginTime,
      endTime,
    };
  }

  private getPlanConfigs(rightPlan) {
    return this.days.reduce((accumulator, current) => {
      const planConfig = this.toPlanConfig(1, current, rightPlan);

      const planConfigs = range(7, 2).map((id) =>
        this.toPlanConfig(id, current, null)
      );

      return [planConfig, ...planConfigs, ...accumulator];
    }, []);
  }

  async saveUserRight(params: SaveUserRightParams): Promise<Response> {
    const { id, name } = params;

    const planConfigs = this.getPlanConfigs(params);

    const configs = planConfigs.map((planConfig) => ({
      id: planConfig.id,
      enable: true,
      week: planConfig.week,
      TimeSegment: {
        beginTime: planConfig.beginTime,
        endTime: planConfig.endTime,
      },
    }));

    const response: Response = await this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/UserRightWeekPlanCfg/${id}?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          UserRightWeekPlanCfg: {
            enable: true,
            WeekPlanCfg: configs,
          },
        }),
      }
    );

    if (response.status != 200) {
      return Promise.reject("Error to create user right");
    }

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/UserRightPlanTemplate/${id}?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          UserRightPlanTemplate: {
            enable: true,
            templateName: name,
            weekPlanNo: id,
            holidayGroupNo: "",
          },
        }),
      }
    );
  }

  async deleteAllUserRight(): Promise<void> {
    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/ClearPlansCfg?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          ClearPlansCfg: {
            ClearFlags: { userRightWeekPlan: true },
          },
        }),
      }
    );
  }

  reboot(): Promise<Response> {
    return this.httpClient.fetch(`http://${this.host}/ISAPI/System/reboot`, {
      method: "put",
    });
  }
}

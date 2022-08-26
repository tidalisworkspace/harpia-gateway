import { formatISO } from "date-fns";
import DigestFetch from "digest-fetch";
import fs from "fs";
import parametroModel from "../database/models/parametro.model";
import logger from "../../shared/logger";
import { DeviceClient, Manufacturer } from "./types";
import responseUtil from "./ResponseUtil";

export class HikvisionClient implements DeviceClient {
  private host: string;
  private httpClient: DigestFetch;

  getManufacturer(): Manufacturer {
    return "<HIKV>";
  }

  async init(ip: string, port: number): Promise<DeviceClient> {
    this.host = `${ip}:${port}`;

    try {
      const parametro = await parametroModel().findOne();
      const username = parametro?.usuarioHikvision || "admin";
      const password = parametro?.senhaHikvision || "admin";
      logger.info("username:", username);
      logger.info("password:", password);
      this.httpClient = new DigestFetch(username, password);
    } catch (e) {
      logger.error(
        `Device client [${this.getManufacturer()}] error ${e.message}`
      );
      this.httpClient = new DigestFetch("admin", "admin");
    }

    return this;
  }

  saveCard(params): Promise<Response> {
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

  deleteCards(params): Promise<Response> {
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
    const faceBuffer = responseUtil.getContent(body, "<HIKV>");

    return faceBuffer.toString("base64");
  }

  saveFace(params): Promise<Response> {
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

  deleteFaces(params): Promise<Response> {
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
    await this.httpClient.fetch(`http://${this.host}/ISAPI/System/time/timeZone`, {
      method: "put",
      body: "GMT+3",
    });

    const datetime = formatISO(new Date());

    return this.httpClient.fetch(`http://${this.host}/ISAPI/System/time`, {
      method: "put",
      body: `<Time version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><timeMode>manual</timeMode><localTime>${datetime}</localTime><timeZone>GMT+3</timeZone></Time>`,
    });
  }

  saveUser(params): Promise<Response> {
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

  deleteUsers(params): Promise<Response> {
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

  async saveUserRight(params): Promise<Response> {
    const { id, name, planConfigs } = params;

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

  deleteUserRight(params): Promise<Response> {
    const { flags } = params;

    return this.httpClient.fetch(
      `http://${this.host}/ISAPI/AccessControl/ClearPlansCfg?format=json`,
      {
        method: "put",
        body: JSON.stringify({
          ClearPlansCfg: {
            ClearFlags: flags,
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

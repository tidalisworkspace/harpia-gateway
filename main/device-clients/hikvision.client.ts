import { formatISO } from "date-fns";
import DigestFetch from "digest-fetch";
import fs from "fs";
import ping from "ping";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import range from "../helpers/range";
import responseReader from "../helpers/response-reader";
import { TimeRange } from "../socket-server/types/handler.types";
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
  SetEventsServerParams,
} from "./types";

export class HikvisionClient implements DeviceClient<Response> {
  private ip: string;
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

  async init(ip: string, port: number): Promise<DeviceClient<Response>> {
    this.ip = ip;
    this.host = `${ip}:${port}`;

    try {
      const parametro = await parametroModel().findOne();
      const username = parametro?.usuarioHikvision || "admin";
      const password = parametro?.senhaIntelbras || "admin";

      this.httpClient = new DigestFetch(username, password);
    } catch (e) {
      logger.error(`hikvision-client:${this.host} ${e.name}:${e.message}`);

      this.httpClient = new DigestFetch("admin", "admin");
    }

    return this;
  }

  private async fetchAndLog(
    url: string,
    options: RequestInit = null
  ): Promise<Response> {
    const request: Promise<Response> = options
      ? this.httpClient.fetch(url, options)
      : this.httpClient.fetch(url);

    const response = await request;

    if (!response.ok) {
      const responseBody = await response.text();

      logger.warn(
        `hikvision-client:${this.host} response not ok ${url} ${response.status} ${response.statusText} ${responseBody}`
      );
    }

    return response;
  }

  saveCard(params: SaveCardParams): Promise<Response> {
    const { id, number } = params;

    return this.fetchAndLog(
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

    return this.fetchAndLog(
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

    return this.fetchAndLog(
      `http://${this.host}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json`,
      {
        method: "post",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": stream.length.toString(),
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

    return this.fetchAndLog(
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
    return this.fetchAndLog(
      `http://${this.host}/ISAPI/AccessControl/RemoteControl/door/1`,
      {
        method: "put",
        body: '<RemoteControlDoor version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><cmd>open</cmd></RemoteControlDoor>',
      }
    );
  }

  async updateTime(): Promise<Response> {
    await this.fetchAndLog(`http://${this.host}/ISAPI/System/time/timeZone`, {
      method: "put",
      body: "GMT+3",
    });

    const datetime = formatISO(new Date());

    return this.fetchAndLog(`http://${this.host}/ISAPI/System/time`, {
      method: "put",
      body: `<Time version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><timeMode>manual</timeMode><localTime>${datetime}</localTime><timeZone>GMT+3</timeZone></Time>`,
    });
  }

  saveUser(params: SaveUserParams): Promise<Response> {
    const { id, name, rightPlans, expiration } = params;

    let RightPlan: any = [{ planTemplateNo: ["1"] }];

    if (rightPlans && rightPlans.length) {
      RightPlan = rightPlans.map((rightPlan) => ({
        planTemplateNo: rightPlan.toString(),
      }));
    }

    const Valid = expiration
      ? { enable: true, ...expiration }
      : { enable: false };

    return this.fetchAndLog(
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

    return this.fetchAndLog(
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

  private toPlanConfig(id: number, day: string, params: SaveUserRightParams) {
    if (!params) {
      return {
        id,
        week: this.capitalize(day),
        ...this.defaultTimeRange,
      };
    }

    const { beginTime, endTime } = params[day] || this.defaultTimeRange;

    return {
      id,
      week: this.capitalize(day),
      beginTime,
      endTime,
    };
  }

  private getPlanConfigs(params: SaveUserRightParams) {
    return this.days.reduce((accumulator, current) => {
      const planConfig = this.toPlanConfig(1, current, params);

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

    const response: Response = await this.fetchAndLog(
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

    if (!response.ok) {
      return Promise.reject("Error to create user right");
    }

    return this.fetchAndLog(
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
    await this.fetchAndLog(
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
    return this.fetchAndLog(`http://${this.host}/ISAPI/System/reboot`, {
      method: "put",
    });
  }

  async setEventsServer(params: SetEventsServerParams): Promise<void> {
    const { ip, port } = params;

    const body = `
    <HttpHostNotificationList>
      <HttpHostNotification>
        <id>1</id>
        <url>http://${ip}:${port}/hikvision/events</url>
        <protocolType>HTTP</protocolType>
        <parameterFormatType>JSON</parameterFormatType>
        <addressingFormatType>ipaddress</addressingFormatType>
        <ipAddress>${ip}</ipAddress>
        <portNo>${port}</portNo>
        <httpAuthenticationMethod>none</httpAuthenticationMethod>
            <uploadImagesDataType>URL</uploadImagesDataType>
            <EventList>
                <Event>
                    <type>AccessControllerEvent</type>
                    <pictureURLType>URL</pictureURLType>
                </Event>
            </EventList>
      </HttpHostNotification>
    </HttpHostNotificationList>
    `.trim();

    await this.fetchAndLog(
      `http://${this.host}/ISAPI/Event/notification/httpHosts`,
      {
        method: "put",
        body,
      }
    );
  }

  async testConnection(): Promise<string> {
    const { alive } = await ping.promise.probe(this.ip);

    if (!alive) {
      return "ping_failed";
    }

    let response = await this.fetchAndLog(`http://${this.host}`);

    if (!response.ok) {
      return "response_not_ok";
    }

    response = await this.fetchAndLog(`http://${this.host}/ISAPI/System/time`);

    if (!response.ok) {
      return "invalid_credentials";
    }

    return "connected";
  }
}

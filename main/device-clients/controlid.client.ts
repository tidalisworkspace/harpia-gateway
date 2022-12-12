import axios, { Axios, AxiosRequestConfig, AxiosResponse } from "axios";
import { differenceInSeconds, format, parse, startOfDay } from "date-fns";
import fs from "fs";
import ping from "ping";
import { v4 as uuid } from "uuid";
import logger from "../../shared/logger";
import parametroModel from "../database/models/parametro.model";
import {
  DeleteCardsParams,
  DeleteEventsParams,
  DeleteFacesParams,
  DeleteUsersParams,
  DeviceClient,
  Manufacturer,
  SaveCardParams,
  SaveFaceParams,
  SaveUserParams,
  SaveUserRightParams,
  SetEventsServerParams,
  UserCredentials,
} from "./types";

const sessions = {};

export class ControlidClient implements DeviceClient<AxiosResponse> {
  private ip: string;
  private host: string;
  private httpClient: Axios;
  private days: string[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  getManufacturer(): Manufacturer {
    return "<CIBM>";
  }

  async init(ip: string, port: number): Promise<DeviceClient<AxiosResponse>> {
    this.ip = ip;
    this.host = `${ip}:${port}`;

    try {
      this.httpClient = axios.create({
        baseURL: `http://${this.host}`,
        validateStatus: null,
      });

      return this;
    } catch (e) {
      logger.error(`controlid-client:${this.host} ${e.name}:${e.message}`);

      return null;
    }
  }

  private isOk(response: AxiosResponse) {
    return response.status >= 200 && response.status <= 299;
  }

  private async createObjects(
    object: string,
    values: any[]
  ): Promise<AxiosResponse> {
    const response = await this.fetchAndLogWithSession({
      method: "post",
      url: "create_objects.fcgi",
      data: {
        object,
        values,
      },
    });

    if (!this.isOk(response)) {
      throw new Error(`failed to create objects ${object}`);
    }

    return response;
  }

  private async loadObjects(
    object: string,
    where: any
  ): Promise<AxiosResponse> {
    const data = where
      ? {
          object,
          where: {
            [object]: where,
          },
        }
      : { object };

    const response = await this.fetchAndLogWithSession({
      method: "post",
      url: "/load_objects.fcgi",
      data,
    });

    if (!this.isOk(response)) {
      throw new Error(`failed to load objects ${object}`);
    }

    return response;
  }

  private async destroyObjects(
    object: string,
    where?: any
  ): Promise<AxiosResponse> {
    const data = where
      ? {
          object,
          where: {
            [object]: where,
          },
        }
      : { object };

    const response = await this.fetchAndLogWithSession({
      method: "post",
      url: "/destroy_objects.fcgi",
      data,
    });

    if (!this.isOk(response)) {
      throw new Error(`failed to load objects ${object}`);
    }

    return response;
  }

  private async login(params: {
    login: string;
    password: string;
  }): Promise<string> {
    const { login, password } = params;

    try {
      const response = await this.fetchAndLog({
        method: "post",
        url: "/login.fcgi",
        data: { login, password },
      });

      if (!this.isOk(response)) {
        return;
      }

      return response.data.session;
    } catch (e) {
      logger.error(`controlid-client:${this.host} ${e.name}:${e.message}`);
      return;
    }
  }

  private async sessionIsValid(params: { session: string }): Promise<boolean> {
    try {
      const response = await this.fetchAndLog({
        method: "post",
        url: "/session_is_valid.fcgi",
        params,
      });

      if (!this.isOk(response)) {
        return false;
      }

      return response.data.session_is_valid;
    } catch (e) {
      logger.error(`controlid-client:${this.host} ${e.name}:${e.message}`);
      return false;
    }
  }

  private hasSession() {
    return Boolean(sessions[this.host]);
  }

  private getSession(): string {
    return sessions[this.host];
  }

  private setSession(session: string) {
    sessions[this.host] = session;
  }

  private async getLoginAndPassword(): Promise<{
    login: string;
    password: string;
  }> {
    const defaultCredentials = { login: "admin", password: "admin" };

    try {
      const parametro = await parametroModel().findOne({
        attributes: ["usuarioControlId", "senhaControlId"],
      });
      const login = parametro?.usuarioControlId || defaultCredentials.login;
      const password = parametro?.senhaControlId || defaultCredentials.password;

      return { login, password };
    } catch (e) {
      logger.error(
        `controlid-client:${this.host}:get-login-and-password ${e.name}:${e.message}`
      );

      return defaultCredentials;
    }
  }

  private async createSession(): Promise<string> {
    if (!this.hasSession()) {
      const params = await this.getLoginAndPassword();
      const session = await this.login(params);

      if (!session) {
        return session;
      }

      this.setSession(session);

      logger.debug(
        `controlid-client:${this.host}:generate-session session created`
      );

      return session;
    }

    let session = this.getSession();
    const isValid = await this.sessionIsValid({ session });

    if (isValid) {
      return session;
    }

    const params = await this.getLoginAndPassword();
    session = await this.login(params);

    if (!session) {
      return session;
    }

    this.setSession(session);

    logger.debug(
      `controlid-client:${this.host}:generate-session sessiion replaced`
    );

    return session;
  }

  private newId(): number {
    let id: string = uuid();
    id = id.replaceAll(/[^0-9]/g, "");
    id = id.slice(0, 6);

    return Number(id);
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

      logger.warn(`controlid-client:${this.host} response not ok ${details}`);
    }

    return response;
  }

  private async fetchAndLogWithSession(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const session = await this.createSession();
    config.params = config.params ? { ...config.params, session } : { session };

    return this.fetchAndLog(config);
  }

  openDoor(): Promise<AxiosResponse> {
    const config: AxiosRequestConfig = {
      method: "post",
      url: "/execute_actions.fcgi",
      data: {
        actions: [
          {
            action: "sec_box",
            parameters: "id=65793, reason=3",
          },
        ],
      },
    };

    return this.fetchAndLogWithSession(config);
  }

  private getDatetimeObject() {
    const now = new Date();

    const day = Number(format(now, "dd"));
    const month = Number(format(now, "MM"));
    const year = Number(format(now, "yyyy"));
    const hour = Number(format(now, "HH"));
    const minute = Number(format(now, "mm"));
    const second = Number(format(now, "ss"));

    return { day, month, year, hour, minute, second };
  }

  updateTime(): Promise<AxiosResponse> {
    const datetimeObject = this.getDatetimeObject();

    return this.fetchAndLogWithSession({
      method: "post",
      url: "/set_system_time.fcgi",
      data: datetimeObject,
    });
  }

  async captureFace(): Promise<string> {
    const response = await this.fetchAndLogWithSession({
      method: "post",
      url: "/remote_enroll.fcgi",
      data: {
        type: "face",
        save: false,
        sync: true,
        panic_finger: 0,
        auto: true,
        countdown: 5,
      },
    });

    if (!this.isOk(response)) {
      throw Error("response not ok");
    }

    if (!response.data.success) {
      throw Error(`capture failure ${JSON.stringify(response.data)}`);
    }

    return response.data.user_image;
  }

  private toUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  private toDate(timestamp: string): Date {
    return parse(timestamp, "yyyy-MM-dd'T'HH:mm:ss", new Date());
  }

  async saveFace(params: SaveFaceParams): Promise<AxiosResponse> {
    const { id, picture } = params;

    const timestamp = this.toUnixTimestamp(new Date());
    const file = fs.readFileSync(picture);

    return this.fetchAndLogWithSession({
      method: "post",
      url: "/user_set_image.fcgi",
      headers: { "Content-Type": "application/octet-stream" },
      params: { user_id: Number(id), timestamp, match: 0 },
      data: file,
    });
  }

  deleteFaces(params: DeleteFacesParams): Promise<AxiosResponse> {
    return this.fetchAndLogWithSession({
      method: "post",
      url: "/user_destroy_image.fcgi",
      data: { user_ids: params.ids },
    });
  }

  saveCard(params: SaveCardParams): Promise<AxiosResponse> {
    const { id, number } = params;

    const cards = [
      { id: this.newId(), value: Number(number), user_id: Number(id) },
    ];

    return this.createObjects("cards", cards);
  }

  deleteCards(params: DeleteCardsParams): Promise<AxiosResponse> {
    return this.destroyObjects("cards", { user_id: { IN: params.ids } });
  }

  private async userHashPassword(password?: string): Promise<UserCredentials> {
    const emptyCredentials = {
      password: "",
      salt: "",
    };

    if (!Boolean(password)) {
      return emptyCredentials;
    }

    const response = await this.fetchAndLogWithSession({
      method: "post",
      url: "/user_hash_password.fcgi",
      data: { password },
    });

    if (!this.isOk(response)) {
      return emptyCredentials;
    }

    return response.data;
  }

  async saveUser(params: SaveUserParams): Promise<AxiosResponse> {
    const { id, name, rightPlans, expiration, role, password } = params;
    const objectId = Number(id);

    let begin_time = null;
    let end_time = null;

    if (expiration) {
      begin_time = this.toUnixTimestamp(this.toDate(expiration.beginTime));
      end_time = this.toUnixTimestamp(this.toDate(expiration.endTime));
    }

    const userCredentials = await this.userHashPassword(password);

    const users = [
      {
        id: objectId,
        name,
        registration: "",
        ...userCredentials,
        begin_time,
        end_time,
      },
    ];

    let response = await this.createObjects("users", users);

    if (role === "admin") {
      response = await this.createObjects("user_roles", [
        { user_id: objectId, role: 1 },
      ]);
    }

    if (rightPlans && rightPlans.length) {
      const userGroups = rightPlans.map((rightPlan) => ({
        user_id: objectId,
        group_id: rightPlan,
      }));

      response = await this.createObjects("user_groups", userGroups);
    }

    return response;
  }

  deleteUsers(params: DeleteUsersParams): Promise<AxiosResponse> {
    const ids = params.ids.map((id) => Number(id));

    return this.destroyObjects("users", { id: { IN: ids } });
  }

  deleteAllUsers(): Promise<AxiosResponse> {
    return this.destroyObjects("users");
  }

  private toSeconds(time: string) {
    time = time === "24:00:00" ? "23:59:59" : time;
    const date = parse(time, "HH:mm:ss", new Date());
    return differenceInSeconds(date, startOfDay(date));
  }

  private toTimeSpan(day: string, params: SaveUserRightParams): any {
    let timeSpan = {
      id: this.newId(),
      time_zone_id: Number(params.id),
      start: 0,
      end: 0,
      hol1: 0,
      hol2: 0,
      hol3: 0,
    };

    timeSpan = this.days.reduce((accumulator, current) => {
      const initials = current.slice(0, 3);

      if (current !== day) {
        return Object.assign(accumulator, { [initials]: 0 });
      }

      const start = this.toSeconds(params[day].beginTime);
      const end = this.toSeconds(params[day].endTime);

      return Object.assign(accumulator, { [initials]: 1, start, end });
    }, timeSpan);

    return timeSpan;
  }

  private toTimeSpans(params: SaveUserRightParams): any[] {
    return this.days
      .filter((day) => Boolean(params[day]))
      .map((day) => this.toTimeSpan(day, params));
  }

  async saveUserRight(params: SaveUserRightParams): Promise<AxiosResponse> {
    const { id, name } = params;

    if (id === "1") {
      return;
    }

    const objectId = Number(id);

    await this.createObjects("groups", [{ id: objectId, name }]);

    await this.createObjects("time_zones", [{ id: objectId, name }]);

    await this.createObjects("access_rules", [
      { id: objectId, name, type: 1, priority: 0 },
    ]);

    await this.createObjects("access_rule_time_zones", [
      {
        access_rule_id: objectId,
        time_zone_id: objectId,
      },
    ]);

    await this.createObjects("portal_access_rules", [
      {
        portal_id: 1,
        access_rule_id: objectId,
      },
    ]);

    await this.createObjects("group_access_rules", [
      {
        group_id: objectId,
        access_rule_id: objectId,
      },
    ]);

    const timeSpans = this.toTimeSpans(params);

    return this.createObjects("time_spans", timeSpans);
  }

  async deleteAllUserRight(): Promise<void> {
    await this.destroyObjects("groups");
    await this.destroyObjects("time_zones");
    await this.destroyObjects("access_rules");
  }

  reboot(): Promise<AxiosResponse> {
    return this.fetchAndLogWithSession({ method: "post", url: "/reboot.fcgi" });
  }

  async setEventsServer(params: SetEventsServerParams): Promise<void> {
    const { ip, port } = params;

    await this.fetchAndLogWithSession({
      method: "post",
      url: "/set_configuration.fcgi",
      data: {
        monitor: {
          request_timeout: "3000",
          hostname: ip,
          port: port.toString(),
          path: "controlid/events",
        },
      },
    });
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

    const params = await this.getLoginAndPassword();

    const session = await this.login(params);

    if (!Boolean(session)) {
      return "invalid_credentials";
    }

    return "connected";
  }

  async getEvents(): Promise<any[]> {
    try {
      const response = await this.loadObjects("access_logs", {
        event: { IN: [7] },
      });

      return response.data.access_logs;
    } catch (e) {
      return [];
    }
  }

  async deleteEvents(params: DeleteEventsParams): Promise<void> {
    try {
      const ids = params.ids.map(Number);

      await this.destroyObjects("access_logs", { id: { IN: ids } });
    } catch (e) {
      logger.error(`controlid-client:${this.host} ${e.name}:${e.message}`);
    }
  }
}

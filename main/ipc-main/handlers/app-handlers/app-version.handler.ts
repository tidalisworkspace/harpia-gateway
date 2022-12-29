import { app } from "electron";
import { APP_VERSION } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import { IpcMainHandler } from "../../types";

export default class AppVersionHandler implements IpcMainHandler {
  channel = APP_VERSION;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: app.getVersion(),
    };
  }
}

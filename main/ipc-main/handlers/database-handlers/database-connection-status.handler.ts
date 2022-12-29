import { DATABASE_CONNECTION_STATUS } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import database from "../../../database";
import { IpcMainHandler } from "../../types";

export class DatabaseConnectionStatusHandler implements IpcMainHandler {
  channel = DATABASE_CONNECTION_STATUS;

  async handle(): Promise<IpcResponse> {
    await database.getConnection().authenticate();

    return { status: "success" };
  }
}

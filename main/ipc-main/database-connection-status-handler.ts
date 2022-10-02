import { DATABASE_CONNECTION_STATUS } from "../../shared/constants/ipc-main-channels";
import { IpcResponse } from "../../shared/ipc/types";
import database from "../database";
import { IpcHandler } from "./types";

export class DatabaseConnectionStatusHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_STATUS;

  async handle(): Promise<IpcResponse> {
    await database.getConnection().authenticate();

    return { status: "success" };
  }
}

import AppVersionHandler from "./app-version-handler";
import { DatabaseConnectionStatusHandler } from "./database-connection-status-handler";
import { DatabaseTestConnectionHandler } from "./database-test-connection-handler";
import { DatabaseConnectionUpdateHandler } from "./database-update-connection-handler";
import HardwareEventsServerUpdateHandler from "./hardware-configure-events-server-handler";
import HardwareFindAllHandler from "./hardware-find-all-handler";
import HardwareRebootHandler from "./hardware-reboot-handler";
import HardwareTestConnection from "./hardware-test-connection-handler";
import HardwareUpdateDatetimeHandler from "./hardware-update-datetime-handler";
import HttpIpHandler from "./http-ip-handler";
import HttpPortHandler from "./http-port-handler";
import HttpStateHandler from "./http-state-handler";
import IpcMain from "./ipc-main";
import { LoggerFileCleanHandler } from "./logger-file-clean-handler";
import { LoggerFileOpenHandler } from "./logger-file-open-handler.ipc";
import { LoggerFileSizeHandler } from "./logger-file-size-handler";
import SocketConnectionsAmountHandler from "./socket-connections-amount-handler";
import SocketPortHandler from "./socket-port-handler";
import SocketStateHandler from "./socket-state-handler";

const asyncHandlers = [
  new LoggerFileOpenHandler(),
  new LoggerFileCleanHandler(),
  new LoggerFileSizeHandler(),

  new HardwareFindAllHandler(),
  new HardwareRebootHandler(),
  new HardwareUpdateDatetimeHandler(),
  new HardwareEventsServerUpdateHandler(),
  new HardwareTestConnection(),

  new DatabaseConnectionStatusHandler(),
  new DatabaseTestConnectionHandler(),
  new DatabaseConnectionUpdateHandler(),

  new SocketConnectionsAmountHandler(),
  new SocketPortHandler(),
  new SocketStateHandler(),

  new HttpIpHandler(),
  new HttpPortHandler(),
  new HttpStateHandler(),

  new AppVersionHandler(),
];

const syncHandlers = [];

const ipcMain = new IpcMain(asyncHandlers, syncHandlers);

export default ipcMain;

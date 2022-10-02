import handlers from "./handlers";
import IpcMain from "./ipc-main";

const ipcMain = new IpcMain(handlers);

export default ipcMain;

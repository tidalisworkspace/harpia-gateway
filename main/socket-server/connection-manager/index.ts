import cameraHandlerManager from "../camera-handlers";
import handlerManager from "../handlers";
import ConnectionManager from "./connection-manager";

const connectionManager = new ConnectionManager(
  handlerManager,
  cameraHandlerManager
);

export default connectionManager;

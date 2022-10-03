import handlerManager from "../handlers";
import ConnectionManager from "./connection-manager";

const connectionManager = new ConnectionManager(handlerManager);

export default connectionManager;

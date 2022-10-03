import connectionManager from "./connection-manager";
import SocketServer from "./socket-server";

const socketServer = new SocketServer(connectionManager);

export default socketServer;

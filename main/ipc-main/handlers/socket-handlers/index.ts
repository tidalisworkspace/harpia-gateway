import SocketConnectionsAmountHandler from "./socket-connections-amount-handler";
import SocketPortHandler from "./socket-port-handler";
import SocketStateHandler from "./socket-state-handler";

export default [
  new SocketConnectionsAmountHandler(),
  new SocketPortHandler(),
  new SocketStateHandler(),
];

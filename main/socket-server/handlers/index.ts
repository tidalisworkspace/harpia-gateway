import { SocketConnectionHandler } from "../types/handler.types";
import { CaptureFaceHandler } from "./capture-face.handler";
import { DeleteAllUserRightHandler } from "./delete-all-user-right.handler";
import { DeleteAllUserHandler } from "./delete-all-user.handler";
import { DeleteUserHandler } from "./delete-user.handler";
import HandlerManager from "./handler-manager";
import { RebootHandler } from "./reboot.handler";
import { SaveUserRightHandler } from "./save-user-right.handler";
import { SaveUserHandler } from "./save-user.handler";
import { SaveWhiteListHandler } from "./save-white-list.handler";
import { TriggerRelayHandler } from "./trigger-relay.handler";

const handlers: SocketConnectionHandler[] = [
  new CaptureFaceHandler(),
  new DeleteAllUserRightHandler(),
  new DeleteAllUserHandler(),
  new DeleteUserHandler(),
  new RebootHandler(),
  new SaveUserRightHandler(),
  new SaveUserHandler(),
  new SaveWhiteListHandler(),
  new TriggerRelayHandler(),
];

const handlerManager = new HandlerManager(handlers);

export default handlerManager;

import { BodyReader } from "./body-reader";
import CameraHandlerManager from "./camera-handler-manager";
import { HeaderReader } from "./header-reader";
import headerValueDefinitions from "./header-value-definitions";
import headerValueReaders from "./header-value-readers";
import headerValueWritters from "./header-value-writters";
import { HeaderWritter } from "./header-writter";
import { RegisterHandler } from "./register.handler";
import { SocketCameraConnectionHandler } from "./types";

const headerWritter = new HeaderWritter(
  headerValueDefinitions,
  headerValueWritters
);

const headerReader = new HeaderReader(
  headerValueDefinitions,
  headerValueReaders
);

const bodyReader = new BodyReader();

const handlers: SocketCameraConnectionHandler[] = [
  new RegisterHandler(headerWritter),
];

const cameraHandlerManager = new CameraHandlerManager(
  headerReader,
  bodyReader,
  handlers
);

export default cameraHandlerManager;

import HttpIpHandler from "./http-ip.handler";
import HttpPortHandler from "./http-port.handler";
import HttpStateHandler from "./http-state.handler";

export default [
  new HttpIpHandler(),
  new HttpPortHandler(),
  new HttpStateHandler(),
];

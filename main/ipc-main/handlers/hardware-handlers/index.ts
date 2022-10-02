import HardwareConnectionTestHandler from "./hardware-connection-test.handler";
import HardwareDatetimeUpdateHandler from "./hardware-datetime-update.handler";
import HardwareEventsServerUpdateHandler from "./hardware-events-server-update.handler";
import HardwareFindAllHandler from "./hardware-find-all.handler";
import HardwareRebootHandler from "./hardware-reboot.handler";

export default [
  new HardwareConnectionTestHandler(),
  new HardwareDatetimeUpdateHandler(),
  new HardwareEventsServerUpdateHandler(),
  new HardwareFindAllHandler(),
  new HardwareRebootHandler(),
];

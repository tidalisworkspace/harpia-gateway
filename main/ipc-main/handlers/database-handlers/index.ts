import { DatabaseConnectionStatusHandler } from "./database-connection-status.handler";
import { DatabaseConnectionTestHandler } from "./database-connection-test.handler";
import { DatabaseConnectionUpdateHandler } from "./database-connection-update.handler";

export default [
  new DatabaseConnectionStatusHandler(),
  new DatabaseConnectionTestHandler(),
  new DatabaseConnectionUpdateHandler(),
];

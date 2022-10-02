import appHandlers from "./app-handlers";
import databaseHandlers from "./database-handlers";
import hardwareHandlers from "./hardware-handlers";
import httpHandlers from "./http-handlers";
import loggerHandlers from "./logger-handlers";
import socketHandlers from "./socket-handlers";

export default [
  ...appHandlers,
  ...databaseHandlers,
  ...hardwareHandlers,
  ...httpHandlers,
  ...loggerHandlers,
  ...socketHandlers,
];

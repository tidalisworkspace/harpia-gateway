import { Socket } from "net";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";

interface Connection {
  connection: Socket;
  type: string;
}

const connections: { [key: string]: Connection } = {};

function add(connection: Socket, type: string) {
  const id = uuid();

  Object.assign(connections, { [id]: { connection, type } });

  return id;
}

function remove(id: string) {
  if (id in connections) {
    delete connections[id];
  }
}

type Counter = () => number;

const countStrategy: { [key: string]: Counter } = {
  camera: () =>
    Object.keys(connections).filter((id) => connections[id].type === "camera")
      .length,
  cda: () => Object.keys(connections).length,
};

function count(type: string): number {
  const strategy = countStrategy[type];

  if (!strategy) {
    logger.warn(
      `socket:connection-manager:storage no strategy found for type ${type}`
    );
    return 0;
  }

  return strategy();
}

function get(connectionId: string): { connection: Socket; type: string } {
  const connection = connections[connectionId];

  if (!connection) {
    logger.warn(`socket:connection-manager:storage:${connectionId} not found`);
    return null;
  }

  return connection;
}

function getIds(type: string): string[] {
  return Object.keys(connections).filter((id) => connections[id].type === type);
}

export default {
  add,
  remove,
  count,
  get,
  getIds,
};

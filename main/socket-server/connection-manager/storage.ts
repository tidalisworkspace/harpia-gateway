import { Socket } from "net";
import { v4 as uuid } from "uuid";
import logger from "../../../shared/logger";

const connections = {};

function add(connection: Socket) {
  const id = uuid();

  Object.assign(connections, { [id]: connection });

  return id;
}

function remove(id: string) {
  if (id in connections) {
    delete connections[id];
  }
}

function count(): number {
  return Object.keys(connections).length;
}

function get(connectionId: string): Socket {
  const connection = connections[connectionId];

  if (!connection) {
    logger.warn(`socket:connection-manager:storage:${connectionId} not found`);
    return null;
  }

  return connection;
}

function getIds(): string[] {
  return Object.keys(connections);
}

export default {
  add,
  remove,
  count,
  get,
  getIds,
};

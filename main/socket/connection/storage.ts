import { Socket } from "net";
import { v4 as uuid } from "uuid";

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
  return connections[connectionId]
}

export default {
  add,
  remove,
  count,
  get
};

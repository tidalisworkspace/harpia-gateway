import { HeaderValueDefinition, HeaderValueType } from "./types";

const headerValueDefinitions: HeaderValueDefinition[] = [
  {
    name: "magic",
    size: 4,
    start: 0,
    end: 4,
    type: HeaderValueType.TEXT,
  },
  {
    name: "version",
    size: 1,
    start: 4,
    end: 5,
    type: HeaderValueType.NUMBER,
  },
  {
    name: "msgtype",
    size: 1,
    start: 5,
    end: 6,
    type: HeaderValueType.NUMBER,
  },
  {
    name: "datatype",
    size: 1,
    start: 6,
    end: 7,
    type: HeaderValueType.NUMBER,
  },
  {
    name: "resv",
    size: 1,
    start: 7,
    end: 8,
    type: HeaderValueType.TEXT,
  },
  {
    name: "timestamp",
    size: 4,
    start: 8,
    end: 12,
    type: HeaderValueType.NUMBER,
  },
  {
    name: "seq",
    size: 4,
    start: 12,
    end: 16,
    type: HeaderValueType.NUMBER,
  },
  {
    name: "datasize",
    size: 4,
    start: 16,
    end: 20,
    type: HeaderValueType.NUMBER,
  },
];

export default headerValueDefinitions;

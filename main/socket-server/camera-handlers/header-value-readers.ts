import {
  HeaderValueDefinition,
  HeaderValueReader,
  HeaderValueType,
} from "./types";

const numberReader: HeaderValueReader = {
  type: HeaderValueType.NUMBER,
  read(data: Buffer, { size, start, end }: HeaderValueDefinition): number {
    return data.subarray(start, end).readIntLE(0, size);
  },
};

const textReader: HeaderValueReader = {
  type: HeaderValueType.TEXT,
  read(data: Buffer, { start, end }: HeaderValueDefinition): string {
    return data.subarray(start, end).toString();
  },
};

const headerValueReaders = [numberReader, textReader];

export default headerValueReaders;

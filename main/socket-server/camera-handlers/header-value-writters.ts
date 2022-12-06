import {
  HeaderValueDefinition,
  HeaderValueReader,
  HeaderValueType,
  HeaderValueWritter,
  MessageHeader,
} from "./types";

const numberWritter: HeaderValueWritter = {
  type: HeaderValueType.NUMBER,
  write(header: MessageHeader, { name, size }: HeaderValueDefinition): Buffer {
    const data = Buffer.alloc(size);
    data.writeIntLE(header[name], 0, size);

    return data;
  },
};

const textWritter: HeaderValueWritter = {
  type: HeaderValueType.TEXT,
  write(header: MessageHeader, { name, size }: HeaderValueDefinition): Buffer {
    const data = Buffer.alloc(size);
    data.write(header[name]);

    return data;
  },
};

const headerValueWritters = [numberWritter, textWritter];

export default headerValueWritters;

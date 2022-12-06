import logger from "../../../shared/logger";
import {
  headerMagic,
  headerSize,
  HeaderValueDefinition,
  HeaderValueReader,
  HeaderValueType,
  MessageHeader,
} from "./types";

export class HeaderReader {
  private readonly definitions: HeaderValueDefinition[];
  private readonly valueReaders: HeaderValueReader[];

  constructor(
    definitions: HeaderValueDefinition[],
    valueReaders: HeaderValueReader[]
  ) {
    this.definitions = definitions;
    this.valueReaders = valueReaders;
  }

  private getValueReader(type: HeaderValueType) {
    const valueReader = this.valueReaders.find(
      (valueReader) => valueReader.type === type
    );

    if (!valueReader) {
      logger.warn(
        `header-reader:get-value-reader no value reader found for ${type} type`
      );
    }

    return valueReader;
  }

  read(data: Buffer): MessageHeader {
    if (data.length < headerSize) {
      logger.warn(`header-reader:read header size is less than required`);
      return null;
    }

    const header = this.definitions.reduce((accumulator, current) => {
      const valueReader = this.getValueReader(current.type);

      if (!valueReader) {
        return accumulator;
      }

      const value = valueReader.read(data, current);
      return Object.assign(accumulator, { [current.name]: value });
    }, {} as MessageHeader);

    if (header.magic !== headerMagic) {
      logger.warn(`header-reader:read magic not present on header`);
      return null;
    }

    return header;
  }
}

import logger from "../../../shared/logger";
import {
  headerMagic,
  headerSize,
  HeaderValueDefinition,
  HeaderValueReader,
  HeaderValueType,
  HeaderValueWritter,
  MessageHeader,
} from "./types";

export class HeaderWritter {
  private readonly definitions: HeaderValueDefinition[];
  private readonly valueWritters: HeaderValueWritter[];

  constructor(
    definitions: HeaderValueDefinition[],
    valueWritters: HeaderValueWritter[]
  ) {
    this.definitions = definitions;
    this.valueWritters = valueWritters;
  }

  private getValueWritter(type: HeaderValueType) {
    const valueWritter = this.valueWritters.find(
      (valueWritter) => valueWritter.type === type
    );

    if (!valueWritter) {
      logger.warn(
        `header-writter:get-value-writter no value writter found for ${type} type`
      );
    }

    return valueWritter;
  }

  write(header: MessageHeader): Buffer {
    const data = this.definitions.reduce((accumulator, current) => {
      const valueWritter = this.getValueWritter(current.type);

      if (!valueWritter) {
        return accumulator;
      }

      const value = valueWritter.write(header, current);

      return Buffer.concat([accumulator, value]);
    }, Buffer.alloc(0));

    return data;
  }
}

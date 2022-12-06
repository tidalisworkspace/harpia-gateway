import logger from "../../../shared/logger";
import { headerSize } from "./types";

export class BodyReader {
  read(data: Buffer): any {
    try {
      return JSON.parse(data.subarray(headerSize).toString());
    } catch (e) {
      logger.error(`body-reader:read ${e.name}:${e.message}`);
      return null;
    }
  }
}

import logger from "../../../shared/logger";
import { headerSize } from "./types";

export class BodyReader {
  read(data: Buffer): any {
    try {
      const body = JSON.parse(data.subarray(headerSize).toString());
      logger.error(`body-reader:read ${JSON.stringify(body)}`);
      return body;
    } catch (e) {
      return null;
    }
  }
}

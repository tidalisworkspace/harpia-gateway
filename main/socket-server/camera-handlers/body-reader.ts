import logger from "../../../shared/logger";
import { isDev } from "../../helpers/environment";
import { headerSize } from "./types";

export class BodyReader {
  read(data: Buffer): any {
    try {
      const body = JSON.parse(data.subarray(headerSize).toString());

      if (!isDev) {
        return body;
      }

      logger.debug(`body-reader:read ${JSON.stringify(body)}`);

      return body;
    } catch (e) {
      return null;
    }
  }
}

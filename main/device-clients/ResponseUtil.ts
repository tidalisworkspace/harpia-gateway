import logger from "../../shared/logger";
import { Boundary, Manufacturer } from "./types";

class HikvisionBoundary implements Boundary {
  getManufacturer(): Manufacturer {
    return "<HIKV>";
  }

  getToken(): string {
    return "--MIME_boundary";
  }
}

class IntelbrasBoundary implements Boundary {
  getManufacturer(): Manufacturer {
    return "<ITBF>";
  }

  getToken(): string {
    return "--myboundary";
  }
}

class ResponseUtil {
  private eolToken: string = "\r\n";
  private headerToken: string = "Content-Length";
  private boundaries: Boundary[] = [
    new HikvisionBoundary(),
    new IntelbrasBoundary(),
  ];

  private findIndex(data: Buffer, search: string, index: number): number {
    const buffer = Buffer.alloc(search.length);

    for (let i = index; i + search.length < data.length; i++) {
      data.copy(buffer, 0, i, i + search.length);

      if (buffer.toString("utf-8") !== search) {
        continue;
      }

      logger.debug(
        `[ResponseUtil] findIndex: ${i} is index of ${JSON.stringify(search)}`
      );

      return i;
    }

    return index;
  }

  private findBoundaryIndex(data: Buffer, manufacturer: Manufacturer): number {
    const boundary = this.getBoundaryByManufacturer(manufacturer);

    if (!boundary) {
      logger.error(
        "[ResponseUtil] getPartIndex: no boundary defined for",
        manufacturer
      );

      return 0;
    }

    const boundaryToken = boundary.getToken();

    logger.debug(
      `[ResponseUtil] findBoundaryIndex: searching ${boundaryToken} as boundary of ${manufacturer}`
    );

    const firstBoundaryIndex = this.findIndex(data, boundaryToken, 0);

    logger.debug(
      `[ResponseUtil] findBoundaryIndex: first boundary index is ${firstBoundaryIndex}`
    );

    const secondBoundaryIndex = this.findIndex(
      data,
      boundaryToken,
      firstBoundaryIndex + boundaryToken.length
    );

    logger.debug(
      `[ResponseUtil] findBoundaryIndex: second boundary index is ${secondBoundaryIndex}`
    );

    return secondBoundaryIndex;
  }

  private getContentLength(data: Buffer, index: number): number {
    logger.debug(
      `[ResponseUtil] getContentLength: seaching content-length header from ${index} index`
    );

    const headerNameIndex = this.findIndex(data, this.headerToken, index);

    logger.debug(
      `[ResponseUtil] getContentLength: header name index is ${headerNameIndex}`
    );

    const headerValueIndex = headerNameIndex + this.headerToken.length;

    logger.debug(
      `[ResponseUtil] getContentLength: header value index is ${headerValueIndex}`
    );

    const eolIndex = this.findIndex(data, this.eolToken, headerValueIndex);

    logger.debug(
      `[ResponseUtil] getContentLength: end of line index is ${eolIndex}`
    );

    const headerValueSize = eolIndex - headerValueIndex;

    const headerValue = Buffer.alloc(headerValueSize);
    data.copy(headerValue, 0, headerValueIndex, eolIndex);

    const contentLength = Number(
      headerValue
        .toString("utf-8")
        .replace(/[^0-9]/g, "")
        .trim()
    );

    logger.debug(
      `[ResponseUtil] getContentLength: content length found ${contentLength}`
    );

    return contentLength;
  }

  private getBoundaryByManufacturer(manufacturer: Manufacturer): Boundary {
    return this.boundaries.find(
      (boundary) => boundary.getManufacturer() === manufacturer
    );
  }

  private getBoundaryContent(
    data: Buffer,
    contentLength: number,
    index: number
  ): Buffer {
    const blankLine = this.eolToken + this.eolToken;
    const blankLineIndex = this.findIndex(data, blankLine, index);

    const contentIndex = blankLineIndex + blankLine.length;

    const content = Buffer.alloc(contentLength);
    data.copy(content, 0, contentIndex, contentIndex + contentLength);

    return content;
  }

  getContent(data: Buffer, manufacturer: Manufacturer): Buffer {
    logger.debug(`[ResponseUtil] getContent: search content started`);

    const boundaryIndex = this.findBoundaryIndex(data, manufacturer);
    const contentLength = this.getContentLength(data, boundaryIndex);

    return this.getBoundaryContent(data, contentLength, boundaryIndex);
  }
}

const responseUtil = new ResponseUtil();

export default responseUtil;

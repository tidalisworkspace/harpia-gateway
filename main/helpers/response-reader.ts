import logger from "../../shared/logger";
import { Boundary, Manufacturer } from "../device-clients/types";

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

class ResponseReader {
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
        `[ResponseReader] findIndex: ${i} is index of ${JSON.stringify(search)}`
      );

      return i;
    }

    return index;
  }

  private findFirstBoundaryIndex(
    data: Buffer,
    manufacturer: Manufacturer
  ): number {
    const boundary = this.getBoundaryByManufacturer(manufacturer);

    if (!boundary) {
      logger.error(
        "[ResponseReader] findFirstBoundaryIndex: no boundary defined for",
        manufacturer
      );

      return 0;
    }

    const boundaryToken = boundary.getToken();

    logger.debug(
      `[ResponseReader] findFirstBoundaryIndex: searching ${boundaryToken} as boundary of ${manufacturer}`
    );

    const firstBoundaryIndex = this.findIndex(data, boundaryToken, 0);

    logger.debug(
      `[ResponseReader] findFirstBoundaryIndex: first boundary index is ${firstBoundaryIndex}`
    );

    return firstBoundaryIndex;
  }

  private findSecondBoundaryIndex(
    data: Buffer,
    manufacturer: Manufacturer
  ): number {
    const boundary = this.getBoundaryByManufacturer(manufacturer);

    if (!boundary) {
      logger.error(
        "[ResponseReader] findSecondBoundaryIndex: no boundary defined for",
        manufacturer
      );

      return 0;
    }

    const boundaryToken = boundary.getToken();

    logger.debug(
      `[ResponseReader] findSecondBoundaryIndex: searching ${boundaryToken} as boundary of ${manufacturer}`
    );

    const firstBoundaryIndex = this.findIndex(data, boundaryToken, 0);

    logger.debug(
      `[ResponseReader] findSecondBoundaryIndex: first boundary index is ${firstBoundaryIndex}`
    );

    const secondBoundaryIndex = this.findIndex(
      data,
      boundaryToken,
      firstBoundaryIndex + boundaryToken.length
    );

    logger.debug(
      `[ResponseReader] findSecondBoundaryIndex: second boundary index is ${secondBoundaryIndex}`
    );

    return secondBoundaryIndex;
  }

  private getContentLength(data: Buffer, index: number): number {
    logger.debug(
      `[ResponseReader] getContentLength: seaching content-length header from ${index} index`
    );

    const headerNameIndex = this.findIndex(data, this.headerToken, index);

    logger.debug(
      `[ResponseReader] getContentLength: header name index is ${headerNameIndex}`
    );

    const headerValueIndex = headerNameIndex + this.headerToken.length;

    logger.debug(
      `[ResponseReader] getContentLength: header value index is ${headerValueIndex}`
    );

    const eolIndex = this.findIndex(data, this.eolToken, headerValueIndex);

    logger.debug(
      `[ResponseReader] getContentLength: end of line index is ${eolIndex}`
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
      `[ResponseReader] getContentLength: content length found ${contentLength}`
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
    logger.debug(
      `[ResponseReader] getBoundaryContent: seaching blank line from ${index} index`
    );

    const blankLine = this.eolToken + this.eolToken;
    const blankLineIndex = this.findIndex(data, blankLine, index);

    logger.debug(
      `[ResponseReader] getBoundaryContent: blank line index is ${blankLineIndex}`
    );

    const contentIndex = blankLineIndex + blankLine.length;

    logger.debug(
      `[ResponseReader] getBoundaryContent: content index is ${contentIndex}`
    );

    const content = Buffer.alloc(contentLength);
    data.copy(content, 0, contentIndex, contentIndex + contentLength);

    logger.debug(
      `[ResponseReader] getBoundaryContent: content length is ${content.length}`
    );

    return content;
  }

  getFace(data: Buffer, manufacturer: Manufacturer): Buffer {
    logger.debug(`[ResponseReader] getFace: search face started`);

    const boundaryIndex = this.findSecondBoundaryIndex(data, manufacturer);
    const contentLength = this.getContentLength(data, boundaryIndex);

    return this.getBoundaryContent(data, contentLength, boundaryIndex);
  }

  getEvent(data: Buffer, manufacturer: Manufacturer): Buffer {
    logger.debug(`[ResponseReader] getEvent: search event started`);

    const firstBoundaryIndex = this.findFirstBoundaryIndex(data, manufacturer);

    const blankLine = this.eolToken + this.eolToken;
    const blankLineIndex = this.findIndex(data, blankLine, firstBoundaryIndex);

    const contentIndex = blankLineIndex + blankLine.length;

    const secondBoundaryIndex = this.findSecondBoundaryIndex(
      data,
      manufacturer
    );

    const contentLength = secondBoundaryIndex - contentIndex;

    return this.getBoundaryContent(data, contentLength, firstBoundaryIndex);
  }
}

const responseReader = new ResponseReader();

export default responseReader;

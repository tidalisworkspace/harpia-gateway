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

      return i;
    }

    logger.debug(`response-reader:find-index search not found index=${index}`);

    return index;
  }

  private findFirstBoundaryIndex(
    data: Buffer,
    manufacturer: Manufacturer
  ): number {
    const boundary = this.getBoundaryByManufacturer(manufacturer);

    if (!boundary) {
      return 0;
    }

    const boundaryToken = boundary.getToken();

    const firstBoundaryIndex = this.findIndex(data, boundaryToken, 0);

    return firstBoundaryIndex;
  }

  private findSecondBoundaryIndex(
    data: Buffer,
    manufacturer: Manufacturer
  ): number {
    const boundary = this.getBoundaryByManufacturer(manufacturer);

    if (!boundary) {
      return 0;
    }

    const boundaryToken = boundary.getToken();

    const firstBoundaryIndex = this.findIndex(data, boundaryToken, 0);

    const secondBoundaryIndex = this.findIndex(
      data,
      boundaryToken,
      firstBoundaryIndex + boundaryToken.length
    );

    return secondBoundaryIndex;
  }

  private getContentLength(data: Buffer, index: number): number {
    const headerNameIndex = this.findIndex(data, this.headerToken, index);

    const headerValueIndex = headerNameIndex + this.headerToken.length;

    const eolIndex = this.findIndex(data, this.eolToken, headerValueIndex);

    const headerValueSize = eolIndex - headerValueIndex;

    const headerValue = Buffer.alloc(headerValueSize);
    data.copy(headerValue, 0, headerValueIndex, eolIndex);

    const contentLength = Number(
      headerValue
        .toString("utf-8")
        .replace(/[^0-9]/g, "")
        .trim()
    );

    return contentLength;
  }

  private getBoundaryByManufacturer(manufacturer: Manufacturer): Boundary {
    const boundary = this.boundaries.find(
      (boundary) => boundary.getManufacturer() === manufacturer
    );

    if (!boundary) {
      logger.debug(`response-reader:boundary:${manufacturer} not found`);
    }

    return boundary;
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

  getFace(data: Buffer, manufacturer: Manufacturer): Buffer {
    const boundaryIndex = this.findSecondBoundaryIndex(data, manufacturer);
    const contentLength = this.getContentLength(data, boundaryIndex);

    return this.getBoundaryContent(data, contentLength, boundaryIndex);
  }

  getEvent(data: Buffer, manufacturer: Manufacturer): Buffer {
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

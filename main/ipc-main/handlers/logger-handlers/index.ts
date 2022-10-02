import { LoggerFileCleanHandler } from "./logger-file-clean.handler";
import { LoggerFileOpenHandler } from "./logger-file-open.handler";
import { LoggerFileSizeHandler } from "./logger-file-size.handler";

export default [
  new LoggerFileCleanHandler(),
  new LoggerFileOpenHandler(),
  new LoggerFileSizeHandler(),
];

import logger from "electron-log";

const format = "{d}/{m}/{y} {h}:{i}:{s} {level} {text}";

logger.transports.console.format = format;
logger.transports.file.format = format;

export default logger;

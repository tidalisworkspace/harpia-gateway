import cron from "node-cron";
import socketServer from "../socket-server";
import defaultJobOptions from "./default-job-options";

function execute() {
  socketServer.sendAliveMessage();
}

export default cron.schedule("*/30 * * * * *", execute, defaultJobOptions);

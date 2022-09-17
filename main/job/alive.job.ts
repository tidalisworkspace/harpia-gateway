import cron from "node-cron";
import socket from "../socket";
import defaultJobOptions from "./default-job-options";

function execute() {
  socket.sendAliveMessage();
}

export default cron.schedule("*/30 * * * * *", execute, defaultJobOptions);

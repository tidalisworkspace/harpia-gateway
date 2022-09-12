import { ScheduledTask } from "node-cron";
import logger from "../../shared/logger";
import aliveJob from "./alive.job";

class Job {
  private tasks: ScheduledTask[];

  constructor(tasks: ScheduledTask[]) {
    this.tasks = tasks;
  }

  start() {
    logger.info(`cron:job starting ${this.tasks.length} tasks`);
    this.tasks.forEach((task) => task.start());
  }
}

const job = new Job([aliveJob]);

export default job;

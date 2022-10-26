import { ScheduledTask } from "node-cron";
import logger from "../../shared/logger";
import aliveJob from "./alive.job";
import loadControlidEventsJob from "./load-controlid-events.job";

class Job {
  private tasks: ScheduledTask[];

  constructor(tasks: ScheduledTask[]) {
    this.tasks = tasks;
  }

  start() {
    logger.info(`job:start ${this.tasks.length} tasks`);
    this.tasks.forEach((task) => task.start());
  }
}

const job = new Job([aliveJob, loadControlidEventsJob]);

export default job;

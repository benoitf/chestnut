import * as fs from "fs";
import * as path from "path";
/**
 * Logger class that will write log on files/console depending of the level.
 */
export class Logger {

  /* tslint:disable:no-console */
  public debug(...args: any[]): void {
    const fd = fs.openSync(path.join(process.cwd(), "logs/traces.log"), "a+");
    fs.writeSync(fd, new Date() + ":" + args + "\n");
    fs.closeSync(fd);
  }

  public error(...args: any[]): void {
    const fd = fs.openSync(path.join(process.cwd(), "logs/error.log"), "a+");
    fs.writeSync(fd, new Date() + ":" + args + "\n");
    fs.closeSync(fd);
  }
}

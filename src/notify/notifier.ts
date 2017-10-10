
export class Notifier {
  private robot: Hubot.Robot;

  constructor(robot: Hubot.Robot) {
    this.robot = robot;
  }

  public notify(...args: any[]): void {
    (this.robot as any).messageRoom("chebot-actions", "" + args);
  }

  public publishContent(...args: any[]): void {
    (this.robot as any).messageRoom("che-github-essentials", "" + args);
  }

  public error(...args: any[]): void {
    (this.robot as any).messageRoom("florent-test2", "error:" + args);
  }

}

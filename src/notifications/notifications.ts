
import * as GitHub from "github";
import { Issues } from "../issue/issues";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "../pull-request/pull-request-handler";
import { PullRequests } from "../pull-request/pull-requests";

/**
 * Manage the notifications of the user.
 * Check remotely what we can handle
 */
export class Notifications {

  private githubRead: GitHub;
  private githubPush: GitHub;
  private notifier: Notifier;
  private logger: Logger;

  private issues: Issues;
  private pullRequests: PullRequests;

  private checkNotifAfterDate: Date = new Date("02 November 2017 08:00 UTC");

  constructor(
    githubRead: GitHub,
    githubPush: GitHub,
    notifier: Notifier,
    logger: Logger,
    handlers: IPullRequestHandler[]) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
    this.issues = new Issues(githubRead, githubPush, notifier, logger);
    this.pullRequests = new PullRequests(githubRead, githubPush, notifier, logger, handlers);
  }

  public check(): void {
    const activityGetNotificationsParams: GitHub.ActivityGetNotificationsParams = Object.create(null);
    activityGetNotificationsParams.since = this.checkNotifAfterDate;
    this.logger.debug("Checking notifs after date", this.checkNotifAfterDate);
    this.checkNotifAfterDate = new Date();

    this.githubRead.activity.getNotifications(activityGetNotificationsParams, (err, res) => {
      if (err) {
        this.logger.error("Unable to get notifications", err);
        return;
      }
      this.handlePageNotifications(res);
    });
  }

  protected handleNotifications(data: any[]): void {
    this.logger.debug("we are in handleNotifications... and array is ", data.length);

    data.forEach((notif: any) => {
      let commentId: string = "";
      if (notif.subject.url !== notif.subject.latest_comment_url) {
        const match: RegExpExecArray | null = /(?:\/issues\/comments\/)(\d+)/g.exec(notif.subject.latest_comment_url);
        if (match !== null) {
          commentId = match[1];
        }
      }

      if (notif.subject && "PullRequest" === notif.subject.type) {
        const match: RegExpExecArray | null = /(?:\/pulls\/)(\d+)/g.exec(notif.subject.url);
        if (match !== null) {
          const pullRequestNumber: number = parseInt(match[1]);
          const owner: string = notif.repository.owner.login;
          const repo: string = notif.repository.name;
          this.pullRequests.analyze(owner, repo, pullRequestNumber, commentId);
        } else {
          this.logger.error("Unable to get pull request number from the URL", notif.subject.url);
        }
      } else if (notif.subject && "Issue" === notif.subject.type) {
        const match: RegExpExecArray | null = /(?:\/issues\/)(\d+)/g.exec(notif.subject.url);
        if (match !== null) {
          const issueNumber: number = parseInt(match[1]);
          const owner: string = notif.repository.owner.login;
          const repo: string = notif.repository.name;
          this.issues.analyze(owner, repo, issueNumber, commentId);
        } else {
          this.logger.error("Unable to get issue number from the URL", notif.subject.url);
        }
      }

    });

  }

  protected handlePageNotifications(res: any): void {
    this.handleNotifications(res.data);
    if (this.githubRead.hasNextPage(res)) {

      this.githubRead.getNextPage(res, undefined, (nextErr, nextRes) => {
        this.handlePageNotifications(nextRes);
      });
    }
  }
}

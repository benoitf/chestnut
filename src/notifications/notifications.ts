
import * as Octokit from "@octokit/rest";
import { IssueHandler } from "../issue/issue-handler";
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

  private githubRead: Octokit;
  private githubPush: Octokit;
  private notifier: Notifier;
  private logger: Logger;

  private issues: Issues;
  private pullRequests: PullRequests;

  private checkNotifAfterDate: Date = new Date("06 September 2019 15:00 UTC");

  constructor(
    githubRead: Octokit,
    githubPush: Octokit,
    notifier: Notifier,
    logger: Logger,
    prHandlers: IPullRequestHandler[],
    issueHandlers: IssueHandler[],
    ) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
    this.issues = new Issues(githubRead, githubPush, notifier, logger, issueHandlers);
    this.pullRequests = new PullRequests(githubRead, githubPush, notifier, logger, prHandlers);
  }

  public async check(): Promise<void> {
    this.logger.debug("Checking notifs after date", this.checkNotifAfterDate);
    const response = await this.githubRead.paginate(`GET /notifications?since=${this.checkNotifAfterDate.toISOString()}`);
    this.checkNotifAfterDate = new Date();
    this.handleNotifications(response);
  }

  protected handleNotifications(data: any): void {
    this.logger.debug("we are in handleNotifications... and array is ", data.length);

    data.forEach((notif: any) => {
      let commentId: string = "0";
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
          this.pullRequests.analyze(owner, repo, pullRequestNumber, parseInt(commentId));
        } else {
          this.logger.error("Unable to get pull request number from the URL", notif.subject.url);
        }
      } else if (notif.subject && "Issue" === notif.subject.type) {
        const match: RegExpExecArray | null = /(?:\/issues\/)(\d+)/g.exec(notif.subject.url);
        if (match !== null) {
          const issueNumber: number = parseInt(match[1]);
          const owner: string = notif.repository.owner.login;
          const repo: string = notif.repository.name;
          this.issues.analyze(owner, repo, issueNumber, parseInt(commentId));
        } else {
          this.logger.error("Unable to get issue number from the URL", notif.subject.url);
        }
      }

    });

  }

}

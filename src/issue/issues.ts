import * as GitHub from "github";
import { isUndefined } from "util";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";

/**
 * Manage how to handle an issue from github
 */
export class Issues {

  private githubRead: GitHub;
  private githubPush: GitHub;
  private notifier: Notifier;
  private logger: Logger;

  constructor(githubRead: GitHub, githubPush: GitHub, notifier: Notifier, logger: Logger) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
  }

  public analyze(owner: string, repo: string, issueNumber: number, commentId: string): void {

    if (commentId.length > 0) {
      const params: GitHub.IssuesGetCommentParams = Object.create(null);
      params.owner = owner;
      params.repo = repo;
      params.id = commentId;
      this.githubRead.issues.getComment(params, (err, res) => {
        if (err) {
          this.logger.error("----> unable to get issue comment : ", err);
        } else {
          this.doHandleIssue(owner, repo, issueNumber, res.data);
        }
      });
    } else {
      this.doHandleIssue(owner, repo, issueNumber);
    }

  }

  protected doHandleIssue(owner: string, repo: string, issueNumber: number, commentData?: any): void {
    const params: GitHub.IssuesGetParams = Object.create(null);
    params.owner = owner;
    params.repo = repo;
    params.number = issueNumber;

    let action: string;
    let prOnlyActionMode: boolean;

    if (commentData === null || isUndefined(commentData)) {
      action = "This is a new action on the PR";
      prOnlyActionMode = true;
    } else {
      action = "This is a comment on the PR";
      prOnlyActionMode = false;
    }

    this.githubRead.issues.get(params, (err, res) => {

      const issueData = res.data;

      // labels
      const labels: string[] = [];
      if (issueData.labels) {
        issueData.labels.forEach((label: any) => {
          labels.push(label.name);
        });
      }

      // milestone
      let milestone: string;
      if (issueData.milestone) {
        milestone = issueData.milestone.title;
      } else {
        milestone = "N/A";
      }

      let content: string = "";
      if (commentData) {
        content += "![" + commentData.user.login + "](" + commentData.user.avatar_url
          + " =18 " + '"' + commentData.user.login + '"' + ") Issue commented by ["
          + commentData.user.login + "]("
          + commentData.user.html_url + ") on issue created by !["
          + issueData.user.login + "]("
          + issueData.user.avatar_url + " =18 "
          + '"'
          + issueData.user.login + '"' + ") [" + issueData.user.login + "]("
          + issueData.user.html_url + ")";
      } else {
        content += "![" + issueData.user.login
          + "](" + issueData.user.avatar_url
          + " =18 " + '"' + issueData.user.login
          + '"' + ") Issue of ["
          + issueData.user.login + "]("
          + issueData.user.html_url
          + ")";

      }
      content += " _" + issueData.title + "_ ";
      content += "[" + params.owner + "/" + params.repo + "#" + params.number + "](" + issueData.html_url + ")";

      if (!prOnlyActionMode) {
        content += " [new comment](" + commentData.html_url + ")\n";
        if (commentData) {

          const lines = commentData.body.split("\n");
          lines.forEach((line: string) => {
            content += ">" + line;
          });

        }
      } else {
        content += "\n";
      }

      this.notifier.publishContent(content);

      this.logger.debug("Issue details issueNumber", params.number, "base:", "action =",
        action, "labels", labels, "milestone", milestone);

    });
  }
}

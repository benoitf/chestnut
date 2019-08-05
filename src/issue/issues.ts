import * as Octokit from "@octokit/rest";
import { isUndefined } from "util";
import { Actions } from "../action/actions";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IssueHandler } from "./issue-handler";
import { IssueInfo } from "./issue-info";

/**
 * Manage how to handle an issue from github
 */
export class Issues {

  private githubRead: Octokit;
  private githubPush: Octokit;
  private notifier: Notifier;
  private logger: Logger;
  private handlers: IssueHandler[];

  constructor(githubRead: Octokit, githubPush: Octokit, notifier: Notifier, logger: Logger, handlers: IssueHandler[]) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
    this.handlers = handlers;
  }

  public async analyze(owner: string, repo: string, issueNumber: number, comment_id: number): Promise<void> {

    if (comment_id > 0) {
      const params: Octokit.IssuesGetCommentParams = {owner, repo, comment_id};

      const response = await this.githubRead.issues.getComment(params);
      this.doHandleIssue(owner, repo, issueNumber, response.data);
    } else {
      this.doHandleIssue(owner, repo, issueNumber);
    }

  }

  protected async doHandleIssue(owner: string, repo: string, issue_number: number, commentData?: any): Promise<void> {
    const params: Octokit.IssuesGetParams = {owner, repo, issue_number};

    let action: string;
    let prOnlyActionMode: boolean;

    if (commentData === null || isUndefined(commentData)) {
      action = "This is a new action on the PR";
      prOnlyActionMode = true;
    } else {
      action = "This is a comment on the PR";
      prOnlyActionMode = false;
    }

    const response = await this.githubRead.issues.get(params);
    const issueData = response.data;

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
    content += "[" + params.owner + "/" + params.repo + "#" + params.issue_number + "](" + issueData.html_url + ")";

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

      // this.notifier.publishContent(content);

    this.logger.debug("Issue details issueNumber", params.issue_number, "base:", "action =",  action, "labels", labels, "milestone", milestone);
    const issueInfo: IssueInfo = new IssueInfo(issueData, params.repo);
    const actions = new Actions(this.githubPush, this.notifier, params.owner, params.repo, issueInfo.number());
    this.handlers.forEach((handler: IssueHandler) => handler.execute(issueInfo, actions, this.notifier));
  }
}

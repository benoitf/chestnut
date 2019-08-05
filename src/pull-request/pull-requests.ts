import * as Octokit from "@octokit/rest";
import { Actions } from "../action/actions";
import { CommentInfo } from "../comment/comment-info";
import { IssueInfo } from "../issue/issue-info";
import { Logger } from "../log/logger";
import { Notifier } from "../notify/notifier";
import { IPullRequestHandler } from "./pull-request-handler";
import { PullRequestInfo } from "./pull-request-info";
/**
 * Manage the Pull Requests notifications by analyzing and grabbing issue data and comment Data.
 */
export class PullRequests {

  private githubRead: Octokit;
  private githubPush: Octokit;
  private notifier: Notifier;
  private logger: Logger;
  private handlers: IPullRequestHandler[];

  constructor(
    githubRead: Octokit,
    githubPush: Octokit,
    notifier: Notifier,
    logger: Logger,
    handlers: IPullRequestHandler[]) {
    this.githubRead = githubRead;
    this.githubPush = githubPush;
    this.notifier = notifier;
    this.logger = logger;
    this.handlers = handlers;
  }

  public async analyze(owner: string, repo: string, pullRequestNumber: number, comment_id: number): Promise<void> {

    if (comment_id > 0) {
      const params: Octokit.IssuesGetCommentParams = {owner, repo, comment_id};
      const response = await this.githubRead.issues.getComment(params);
      if (response.data) {
          this.doHandlePullRequest(owner, repo, pullRequestNumber, new CommentInfo(response.data));
        }
    } else {
      this.doHandlePullRequest(owner, repo, pullRequestNumber);
    }

  }

  protected async doHandlePullRequest(
    owner: string, repo: string,
    pull_number: number,
    commentInfo?: CommentInfo | undefined): Promise<void> {
    const params: Octokit.PullsGetParams = {owner, repo, pull_number};

    const response = await this.githubRead.pulls.get(params);
    if (response.status === 200) {
        const pullRequestData: Octokit.PullsGetResponse = response.data;
        this.completePullRequestData(owner, repo, pull_number, commentInfo, pullRequestData);
      }
  }

  protected async completePullRequestData(
    owner: string,
    repo: string,
    issue_number: number,
    commentInfo: CommentInfo | undefined,
    pullRequestData: Octokit.PullsGetResponse): Promise<void> {

    const params: Octokit.IssuesGetParams =  {owner, repo, issue_number};

    const reponse = await this.githubRead.issues.get(params);

    const issueInfo: IssueInfo = new IssueInfo(reponse.data, repo);
    const pullRequestInfo: PullRequestInfo = new PullRequestInfo(pullRequestData, issueInfo, commentInfo);
    const actions = new Actions(this.githubPush, this.notifier, pullRequestInfo.repoOwner(),
        pullRequestInfo.repoName(), pullRequestInfo.number());
    this.handlers.forEach((handler: IPullRequestHandler) => handler.execute(pullRequestInfo, actions, this.notifier));
  }
}
